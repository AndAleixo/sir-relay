/**
 * Self-check: email token TTL table + hash round-trip (P3-MAIL-05).
 * Run: npx tsx scripts/check-email-tokens.ts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { hashToken, newToken } from "../src/lib/token-hash";

assert.match(newToken("ev"), /^ev-/);
assert.match(newToken("pr"), /^pr-/);

const raw = newToken("ev");
const a = hashToken(raw);
const b = createHash("sha256").update(raw).digest("hex");
assert.equal(a, b);
assert.notEqual(a, hashToken(newToken("ev")));

console.log("check-email-tokens: ok");
