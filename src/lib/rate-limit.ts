/**
 * P2-SEC-07 — fixed sliding window per key (usually IP).
 * ponytail: in-process Map only; multi-instance / Edge isolate → Redis later.
 */

export const LOGIN_RATE = { limit: 10, windowMs: 60_000 } as const;
export const MUTATION_RATE = { limit: 100, windowMs: 60_000 } as const;

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

/** Timestamps of hits inside the window, oldest first. */
export type RateLimitStore = Map<string, number[]>;

export function consumeRateLimit(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  const cutoff = now - windowMs;
  const hits = (store.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    store.set(key, hits);
    const retryAfterSec = Math.max(1, Math.ceil((hits[0]! + windowMs - now) / 1000));
    return { ok: false, retryAfterSec };
  }

  hits.push(now);
  store.set(key, hits);
  return { ok: true, remaining: limit - hits.length };
}

export function clientIpFromHeaders(headers: {
  get(name: string): string | null;
}): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

/** Login / signup / platform ops login are the cheap brute-force surface (10/min). */
export function isAuthRateLimitedPath(strippedPath: string): boolean {
  return /^\/(login|signup|platform\/login)(\/|$)/.test(strippedPath);
}
