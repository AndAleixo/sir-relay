import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "./i18n/config";

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
});

const PUBLIC_CACHE =
  "public, s-maxage=3600, stale-while-revalidate=86400, max-age=300";
const PRIVATE_CACHE = "private, no-store, max-age=0, must-revalidate";

function isPublicPage(pathname: string): boolean {
  const stripped = pathname.replace(/^\/(en|es|pt)/, "") || "/";
  if (stripped === "/") return true;
  return /^\/(login|signup|privacy|terms|join)(\/|$)/.test(stripped);
}

function isAppPage(pathname: string): boolean {
  const stripped = pathname.replace(/^\/(en|es|pt)/, "");
  return /^\/(tasks|teammates|alerts|profile|settings|groups|change-password)(\/|$)/.test(
    stripped,
  );
}

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  const { pathname } = request.nextUrl;

  if (isPublicPage(pathname)) {
    response.headers.set("Cache-Control", PUBLIC_CACHE);
  } else if (isAppPage(pathname)) {
    response.headers.set("Cache-Control", PRIVATE_CACHE);
  }

  return response;
}

export const config = {
  matcher: ["/", "/(en|es|pt)/:path*"],
};
