import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import {
  defaultLocale,
  localePathPattern,
  locales,
} from "./i18n/config";
import {
  expectedOriginFromHost,
  isSafeHttpMethod,
  isSameOriginMutation,
} from "./lib/csrf-origin";
import {
  LOGIN_RATE,
  MUTATION_RATE,
  clientIpFromHeaders,
  consumeRateLimit,
  isAuthRateLimitedPath,
  type RateLimitStore,
} from "./lib/rate-limit";
import {
  REQUEST_ID_HEADER,
  resolveRequestId,
  runWithRequestId,
} from "./lib/request-context";
import { applySecurityHeaders } from "./lib/security-headers";
import { logJson } from "./lib/safe-log";

/** Keep in sync with `SESSION_COOKIE_NAME` in session-cookie.ts (avoid importing jose into edge). */
const SESSION_COOKIE_NAME = "sirrelay_session";

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
});

const LOCALE_SEGMENT = localePathPattern();

const PUBLIC_CACHE =
  "public, s-maxage=3600, stale-while-revalidate=86400, max-age=300";
const PRIVATE_CACHE = "private, no-store, max-age=0, must-revalidate";

/** Shared across requests in this process. */
const rateLimitStore: RateLimitStore = new Map();

function stripLocale(pathname: string): string {
  return pathname.replace(new RegExp(`^/(${LOCALE_SEGMENT})`), "") || "/";
}

function isPublicPage(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  if (stripped === "/") return true;
  return /^\/(login|signup|demo|privacy|terms|join|contact|forgot-password|reset-password|verify-email|check-email)(\/|$)/.test(
    stripped,
  );
}

/** Landing / login / signup depend on session — never CDN-cache redirects. */
function isSessionVaryingPublic(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  if (stripped === "/") return true;
  return /^\/(login|signup)(\/|$)/.test(stripped);
}

function isAppPage(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  return /^\/(tasks|teammates|projects|events|profile|settings|groups|change-password|accept-terms|platform|connect)(\/|$)/.test(
    stripped,
  );
}

/** Product app routes (not /platform) — unauthenticated visitors go to login. */
function isProductAppPage(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  return /^\/(tasks|teammates|projects|events|profile|settings|groups|change-password|accept-terms|connect)(\/|$)/.test(
    stripped,
  );
}

function localeFromPath(pathname: string): string {
  const first = pathname.split("/")[1]?.toLowerCase() ?? "";
  return (locales as readonly string[]).includes(first) ? first : defaultLocale;
}

/** 307 + no-store so browsers/CDNs never sticky-cache auth redirects onto locale homes. */
function unauthenticatedAppRedirect(request: NextRequest): NextResponse | null {
  if (!isProductAppPage(request.nextUrl.pathname)) return null;
  if (request.cookies.get(SESSION_COOKIE_NAME)?.value) return null;

  const locale = localeFromPath(request.nextUrl.pathname);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}/login`;
  url.search = "";
  const res = NextResponse.redirect(url, 307);
  res.headers.set("Cache-Control", PRIVATE_CACHE);
  return res;
}

function assertCsrfOrigin(request: NextRequest): NextResponse | null {
  if (isSafeHttpMethod(request.method)) return null;

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");
  const expectedOrigin = expectedOriginFromHost(host, proto, "http");

  const ok = isSameOriginMutation({
    method: request.method,
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
    expectedOrigin,
  });

  if (ok) return null;
  return new NextResponse("Forbidden", { status: 403 });
}

function assertRateLimit(request: NextRequest): NextResponse | null {
  if (isSafeHttpMethod(request.method)) return null;

  const stripped = stripLocale(request.nextUrl.pathname);
  const ip = clientIpFromHeaders(request.headers);
  const auth = isAuthRateLimitedPath(stripped);
  const rate = auth ? LOGIN_RATE : MUTATION_RATE;
  const key = `${auth ? "auth" : "mut"}:${ip}`;

  const result = consumeRateLimit(
    rateLimitStore,
    key,
    rate.limit,
    rate.windowMs,
  );

  if (result.ok) return null;

  const res = new NextResponse("Too Many Requests", { status: 429 });
  res.headers.set("Retry-After", String(result.retryAfterSec));
  return res;
}

function withRequestIdOnRequest(
  request: NextRequest,
  requestId: string,
): NextRequest {
  const headers = new Headers(request.headers);
  headers.set(REQUEST_ID_HEADER, requestId);
  return new NextRequest(request.url, { headers, method: request.method });
}

function attachRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

function logSecurityBlock(
  request: NextRequest,
  status: number,
  reason: string,
): void {
  logJson("warn", reason, {
    route: request.nextUrl.pathname,
    method: request.method,
    status,
    // ponytail: last octet only — enough for ops correlation, less PII
    ipHint: clientIpFromHeaders(request.headers).replace(
      /^(\d+\.\d+\.\d+)\.\d+$/,
      "$1.x",
    ),
  });
}

/** Short aliases → full app locales (avoid falling through to English). */
const SHORT_LOCALE_REDIRECT: Record<string, string> = {
  en: "en-gb",
  es: "es-es",
  pt: "pt-br",
};

function shortLocaleRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1]?.toLowerCase() ?? "";
  const target = SHORT_LOCALE_REDIRECT[first];
  if (!target) return null;
  const url = request.nextUrl.clone();
  url.pathname = `/${target}${pathname.slice(first.length + 1) || ""}`;
  return NextResponse.redirect(url, 308);
}

export default function proxy(request: NextRequest) {
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));

  return runWithRequestId(requestId, () => {
    const short = shortLocaleRedirect(request);
    if (short) {
      applySecurityHeaders(request, short);
      return attachRequestId(short, requestId);
    }

    const req = withRequestIdOnRequest(request, requestId);

    const csrfBlocked = assertCsrfOrigin(req);
    if (csrfBlocked) {
      logSecurityBlock(req, 403, "csrf_origin_rejected");
      applySecurityHeaders(req, csrfBlocked);
      return attachRequestId(csrfBlocked, requestId);
    }

    const rateBlocked = assertRateLimit(req);
    if (rateBlocked) {
      logSecurityBlock(req, 429, "rate_limited");
      applySecurityHeaders(req, rateBlocked);
      return attachRequestId(rateBlocked, requestId);
    }

    const authRedirect = unauthenticatedAppRedirect(req);
    if (authRedirect) {
      applySecurityHeaders(req, authRedirect);
      return attachRequestId(authRedirect, requestId);
    }

    const { pathname } = req.nextUrl;
    const response = intlMiddleware(req);

    if (isSessionVaryingPublic(pathname) || isAppPage(pathname)) {
      response.headers.set("Cache-Control", PRIVATE_CACHE);
    } else if (isPublicPage(pathname)) {
      response.headers.set("Cache-Control", PUBLIC_CACHE);
    }

    applySecurityHeaders(req, response);
    return attachRequestId(response, requestId);
  });
}

export const config = {
  matcher: ["/", "/(en|es|pt|en-gb|es-es|pt-br)/:path*"],
};
