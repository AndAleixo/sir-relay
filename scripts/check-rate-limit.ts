/**
 * Self-check: rate limit window (P2-SEC-07).
 * Run: npx tsx scripts/check-rate-limit.ts
 */
import assert from "node:assert/strict";
import {
  AI_SUGGEST_IP_RATE,
  DEMO_AI_SUGGEST_IP_RATE,
  LOGIN_RATE,
  clientIpFromHeaders,
  consumeRateLimit,
  isAuthRateLimitedPath,
} from "../src/lib/rate-limit";

const store = new Map<string, number[]>();
const now = Date.UTC(2026, 6, 19, 12, 0, 0);

for (let i = 0; i < LOGIN_RATE.limit; i++) {
  const r = consumeRateLimit(store, "auth:1.1.1.1", LOGIN_RATE.limit, LOGIN_RATE.windowMs, now + i);
  assert.equal(r.ok, true);
}

const blocked = consumeRateLimit(
  store,
  "auth:1.1.1.1",
  LOGIN_RATE.limit,
  LOGIN_RATE.windowMs,
  now + LOGIN_RATE.limit,
);
assert.equal(blocked.ok, false);
if (!blocked.ok) {
  assert.ok(blocked.retryAfterSec >= 1);
}

const afterWindow = consumeRateLimit(
  store,
  "auth:1.1.1.1",
  LOGIN_RATE.limit,
  LOGIN_RATE.windowMs,
  now + LOGIN_RATE.windowMs + 1,
);
assert.equal(afterWindow.ok, true);

assert.equal(isAuthRateLimitedPath("/login"), true);
assert.equal(isAuthRateLimitedPath("/signup"), true);
assert.equal(isAuthRateLimitedPath("/platform/login"), true);
assert.equal(isAuthRateLimitedPath("/forgot-password"), true);
assert.equal(isAuthRateLimitedPath("/reset-password"), true);
assert.equal(isAuthRateLimitedPath("/check-email"), true);
assert.equal(isAuthRateLimitedPath("/verify-email"), true);
assert.equal(isAuthRateLimitedPath("/contact"), false);
assert.equal(isAuthRateLimitedPath("/platform"), false);
assert.equal(isAuthRateLimitedPath("/tasks"), false);

assert.equal(
  clientIpFromHeaders({
    get: (n) => (n === "x-forwarded-for" ? "10.0.0.9, 10.0.0.1" : null),
  }),
  "10.0.0.9",
);

assert.equal(AI_SUGGEST_IP_RATE.limit, 10);
assert.equal(AI_SUGGEST_IP_RATE.windowMs, 60 * 60 * 1000);
{
  const aiStore = new Map<string, number[]>();
  for (let i = 0; i < AI_SUGGEST_IP_RATE.limit; i++) {
    const r = consumeRateLimit(
      aiStore,
      "ai-suggest:9.9.9.9",
      AI_SUGGEST_IP_RATE.limit,
      AI_SUGGEST_IP_RATE.windowMs,
      now + i,
    );
    assert.equal(r.ok, true);
  }
  const aiBlocked = consumeRateLimit(
    aiStore,
    "ai-suggest:9.9.9.9",
    AI_SUGGEST_IP_RATE.limit,
    AI_SUGGEST_IP_RATE.windowMs,
    now + AI_SUGGEST_IP_RATE.limit,
  );
  assert.equal(aiBlocked.ok, false);
}

assert.equal(DEMO_AI_SUGGEST_IP_RATE.limit, 1);
assert.equal(DEMO_AI_SUGGEST_IP_RATE.windowMs, 24 * 60 * 60 * 1000);

console.log("check-rate-limit: ok");
