/**
 * Self-check: CSRF Origin allow/deny (P2-SEC-06).
 * Run: npx tsx scripts/check-csrf-origin.ts
 */
import assert from "node:assert/strict";
import {
  expectedOriginFromHost,
  isSameOriginMutation,
  normalizeOrigin,
} from "../src/lib/csrf-origin";

assert.equal(normalizeOrigin("https://App.Example.com/"), "https://app.example.com");
assert.equal(
  expectedOriginFromHost("app.example.com", "https"),
  "https://app.example.com",
);
assert.equal(
  expectedOriginFromHost("localhost:3000", "http"),
  "http://localhost:3000",
);

assert.equal(
  isSameOriginMutation({
    method: "GET",
    origin: "https://evil.com",
    referer: null,
    expectedOrigin: "https://app.example.com",
  }),
  true,
);

assert.equal(
  isSameOriginMutation({
    method: "POST",
    origin: "https://app.example.com",
    referer: null,
    expectedOrigin: "https://app.example.com",
  }),
  true,
);

assert.equal(
  isSameOriginMutation({
    method: "POST",
    origin: "https://evil.com",
    referer: null,
    expectedOrigin: "https://app.example.com",
  }),
  false,
);

assert.equal(
  isSameOriginMutation({
    method: "POST",
    origin: null,
    referer: "https://app.example.com/en-gb/tasks",
    expectedOrigin: "https://app.example.com",
  }),
  true,
);

assert.equal(
  isSameOriginMutation({
    method: "POST",
    origin: null,
    referer: null,
    expectedOrigin: "https://app.example.com",
  }),
  false,
);

console.log("check-csrf-origin: ok");
