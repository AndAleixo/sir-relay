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
import { applySecurityHeaders } from "./lib/security-headers";

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
});

const LOCALE_SEGMENT = localePathPattern();

const PUBLIC_CACHE =
  "public, s-maxage=3600, stale-while-revalidate=86400, max-age=300";
const PRIVATE_CACHE = "private, no-store, max-age=0, must-revalidate";

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

export default function middleware(request: NextRequest) {
  const blocked = assertCsrfOrigin(request);
  if (blocked) {
    applySecurityHeaders(request, blocked);
    return blocked;
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
