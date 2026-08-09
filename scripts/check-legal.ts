/**
 * Assert legal pack version wiring. Run: npx tsx scripts/check-legal.ts
 */
import assert from "node:assert/strict";
import {
  CURRENT_LEGAL_VERSION,
  DEFAULT_CONTACT_EMAIL,
  LEGAL_DOCUMENT,
  needsLegalAccept,
  resolveContactEmail,
} from "../src/lib/legal";

assert.equal(CURRENT_LEGAL_VERSION, "2026-08-09");
assert.equal(LEGAL_DOCUMENT.version, CURRENT_LEGAL_VERSION);
assert.ok(LEGAL_DOCUMENT.terms.length >= 5);
assert.ok(LEGAL_DOCUMENT.privacy.length >= 5);

assert.equal(needsLegalAccept(null), true);
assert.equal(needsLegalAccept(""), true);
assert.equal(needsLegalAccept("2020-01-01"), true);
assert.equal(needsLegalAccept(CURRENT_LEGAL_VERSION), false);

assert.equal(DEFAULT_CONTACT_EMAIL, "contact@sirrelay.com");
assert.equal(resolveContactEmail(), DEFAULT_CONTACT_EMAIL);

console.log("ok: legal pack", CURRENT_LEGAL_VERSION);
