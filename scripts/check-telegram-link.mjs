/** ponytail: hash + token shape checks — no DB */
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function newToken(prefix) {
  return `${prefix}-${randomBytes(12).toString("base64url")}`;
}

const code = newToken("tg");
assert.match(code, /^tg-[A-Za-z0-9_-]+$/);
assert.equal(hashToken(code), hashToken(code));
assert.notEqual(hashToken(code), hashToken(newToken("tg")));

console.log("telegram-link checks ok");
