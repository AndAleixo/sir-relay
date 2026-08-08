/**
 * Assert Umami tracker wiring. No Docker required.
 * Run: npx tsx scripts/check-umami-env.ts
 */
import assert from "node:assert/strict";
import { UMAMI_SCRIPT_PATH, resolveUmamiWebsiteId } from "../src/lib/umami";

assert.equal(UMAMI_SCRIPT_PATH, "/script.js");
assert.equal(resolveUmamiWebsiteId(undefined), null);
assert.equal(resolveUmamiWebsiteId(""), null);
assert.equal(resolveUmamiWebsiteId("  "), null);
assert.equal(resolveUmamiWebsiteId("abc"), "abc");
assert.equal(resolveUmamiWebsiteId("  abc  "), "abc");

console.log("ok: umami tracker wiring");
