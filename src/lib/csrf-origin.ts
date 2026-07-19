/**
 * CSRF base (P2-SEC-06): reject cross-origin state-changing requests.
 * Relies on SameSite=Lax session cookies + Origin/Referer matching the request host.
 * Full CSRF tokens only needed if cookie auth is exposed on a public REST API.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

export function isSafeHttpMethod(method: string): boolean {
  return SAFE_METHODS.has(method.toUpperCase());
}

/** Normalize `https://Example.com:443/` → `https://example.com` */
export function normalizeOrigin(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.host.toLowerCase();
    return `${url.protocol}//${host}`;
  } catch {
    return null;
  }
}

export function expectedOriginFromHost(
  hostHeader: string | null,
  protoHeader: string | null,
  fallbackProto = "https",
): string | null {
  const host = hostHeader?.split(",")[0]?.trim().toLowerCase();
  if (!host) return null;
  const proto = (protoHeader?.split(",")[0]?.trim() || fallbackProto).toLowerCase();
  return `${proto}://${host}`;
}

/**
 * Allow mutation when Origin (preferred) or Referer matches the expected app origin.
 * Missing both → deny (strict; modern browsers send Origin on POST).
 */
export function isSameOriginMutation(input: {
  method: string;
  origin: string | null;
  referer: string | null;
  expectedOrigin: string | null;
}): boolean {
  if (isSafeHttpMethod(input.method)) return true;
  if (!input.expectedOrigin) return false;

  const expected = normalizeOrigin(input.expectedOrigin);
  if (!expected) return false;

  if (input.origin) {
    const origin = normalizeOrigin(input.origin);
    return origin !== null && origin === expected;
  }

  if (input.referer) {
    const refererOrigin = normalizeOrigin(input.referer);
    return refererOrigin !== null && refererOrigin === expected;
  }

  return false;
}
