/**
 * Self-check: safe JSON log redaction (P2-SEC-11).
 * Run: npx tsx scripts/check-safe-log.ts
 */
import assert from "node:assert/strict";
import { isSensitiveLogKey, redactForLog } from "../src/lib/safe-log";

assert.equal(isSensitiveLogKey("password"), true);
assert.equal(isSensitiveLogKey("token"), true);
assert.equal(isSensitiveLogKey("body"), true);
assert.equal(isSensitiveLogKey("userId"), false);

const redacted = redactForLog({
  userId: "u1",
  password: "SirRelay1",
  token: "secret-token",
  nested: { body: "feito com detalhes", ok: true },
}) as Record<string, unknown>;

assert.equal(redacted.userId, "u1");
assert.equal(redacted.password, "[redacted]");
assert.equal(redacted.token, "[redacted]");
assert.deepEqual(redacted.nested, { body: "[redacted]", ok: true });

console.log("check-safe-log: ok");
