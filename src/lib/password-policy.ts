/**
 * Password rules for **setting** a password (signup / join / change).
 * Existing hashes are grandfathered — login does not re-check this policy.
 */

const MIN_LEN = 8;

/** Lowercased denylist — keep short; upgrade path: larger curated list. */
const COMMON = new Set([
  "password",
  "password1",
  "password12",
  "password123",
  "12345678",
  "123456789",
  "qwerty12",
  "qwerty123",
  "letmein1",
  "welcome1",
  "admin123",
  "iloveyou",
  "abc12345",
  "passw0rd",
]);

export type PasswordPolicyError =
  | "too_short"
  | "need_upper"
  | "need_number"
  | "too_common";

export function checkPasswordPolicy(password: string): PasswordPolicyError | null {
  if (password.length < MIN_LEN) return "too_short";
  if (!/[A-Z]/.test(password)) return "need_upper";
  if (!/[0-9]/.test(password)) return "need_number";
  if (COMMON.has(password.toLowerCase())) return "too_common";
  return null;
}

/** Throws `Weak password` when the password fails policy. */
export function assertPasswordForSet(password: string): void {
  if (checkPasswordPolicy(password)) {
    throw new Error("Weak password");
  }
}
