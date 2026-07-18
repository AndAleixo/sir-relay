/**
 * Self-check: password policy + login lockout math (P2-SEC-03/04).
 * Run: npx tsx scripts/check-sec-base.ts
 */
import assert from "node:assert/strict";
import {
  checkPasswordPolicy,
  assertPasswordForSet,
} from "../src/lib/password-policy";
import {
  isLoginLocked,
  nextFailedLoginState,
  LOGIN_FAIL_LIMIT,
} from "../src/lib/login-lockout";

assert.equal(checkPasswordPolicy("short"), "too_short");
assert.equal(checkPasswordPolicy("noupper1"), "need_upper");
assert.equal(checkPasswordPolicy("NoNumber"), "need_number");
assert.equal(checkPasswordPolicy("Password1"), "too_common");
assert.equal(checkPasswordPolicy("demo12345"), "need_upper");
assert.equal(checkPasswordPolicy("SirRelay1"), null);

assert.throws(() => assertPasswordForSet("weak"), /Weak password/);
assert.doesNotThrow(() => assertPasswordForSet("SirRelay1"));

const now = Date.UTC(2026, 6, 19, 12, 0, 0);
assert.equal(isLoginLocked(null, now), false);
assert.equal(isLoginLocked(new Date(now - 1), now), false);
assert.equal(isLoginLocked(new Date(now + 1), now), true);

let count = 0;
let locked: Date | null = null;
for (let i = 0; i < LOGIN_FAIL_LIMIT - 1; i++) {
  const next = nextFailedLoginState(count, now);
  count = next.failedLoginCount;
  locked = next.lockedUntil;
  assert.equal(locked, null);
}
const lockedState = nextFailedLoginState(count, now);
assert.equal(lockedState.failedLoginCount, 0);
assert.ok(lockedState.lockedUntil);
assert.equal(lockedState.lockedUntil.getTime(), now + 15 * 60 * 1000);

console.log("check-sec-base: ok");
