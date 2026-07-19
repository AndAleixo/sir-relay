import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
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
import { applySecurityHeaders } from "./lib/security-headers";
import { logJson } from "./lib/safe-log";

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
});

const LOCALE_SEGMENT = localePathPattern();

const PUBLIC_CACHE =
  "public, s-maxage=3600, stale-while-revalidate=86400, max-age=300";
const PRIVATE_CACHE = "private, no-store, max-age=0, must-revalidate";

/** Shared across requests in this process / Edge isolate. */
const rateLimitStore: RateLimitStore = new Map();

function stripLocale(pathname: string): string {
  return pathname.replace(new RegExp(`^/(${LOCALE_SEGMENT})`), "") || "/";
}

function isPublicPage(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  if (stripped === "/") return true;
  return /^\/(login|signup|privacy|terms|join)(\/|$)/.test(stripped);
}

function isAppPage(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  return /^\/(tasks|teammates|alerts|profile|settings|groups|change-password)(\/|$)/.test(
    stripped,
  );
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

export default function middleware(request: NextRequest) {
  const csrfBlocked = assertCsrfOrigin(request);
  if (csrfBlocked) {
    logSecurityBlock(request, 403, "csrf_origin_rejected");
    applySecurityHeaders(request, csrfBlocked);
    return csrfBlocked;
  }

  const rateBlocked = assertRateLimit(request);
  if (rateBlocked) {
    logSecurityBlock(request, 429, "rate_limited");
    applySecurityHeaders(request, rateBlocked);
    return rateBlocked;
  }

  const { pathname } = request.nextUrl;
  const response = intlMiddleware(request);

  if (isPublicPage(pathname)) {
    response.headers.set("Cache-Control", PUBLIC_CACHE);
  } else if (isAppPage(pathname)) {
    response.headers.set("Cache-Control", PRIVATE_CACHE);
  }

  applySecurityHeaders(request, response);
  return response;
}

export const config = {
  matcher: ["/", "/(en-gb|es-es|pt-br)/:path*"],
};
