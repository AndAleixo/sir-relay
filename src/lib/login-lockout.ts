/** Shared lockout math — 5 failures → lock 15 minutes (P2-SEC-03). */

export const LOGIN_FAIL_LIMIT = 5;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;

export function isLoginLocked(lockedUntil: Date | null | undefined, now = Date.now()): boolean {
  return Boolean(lockedUntil && lockedUntil.getTime() > now);
}

export function nextFailedLoginState(
  failedLoginCount: number,
  now = Date.now(),
): { failedLoginCount: number; lockedUntil: Date | null } {
  const next = failedLoginCount + 1;
  if (next >= LOGIN_FAIL_LIMIT) {
    return {
      failedLoginCount: 0,
      lockedUntil: new Date(now + LOGIN_LOCK_MS),
    };
  }
  return { failedLoginCount: next, lockedUntil: null };
}
