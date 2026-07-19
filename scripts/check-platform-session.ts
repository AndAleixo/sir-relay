/**
 * Self-check: platform admin credentials (separate from product session).
 * Run: npx tsx scripts/check-platform-session.ts
 */
import assert from "node:assert/strict";
import {
  platformAdminConfigured,
  verifyPlatformCredentials,
} from "../src/lib/platform-session";

delete process.env.PLATFORM_ADMIN_USERNAME;
delete process.env.PLATFORM_ADMIN_PASSWORD;
assert.equal(platformAdminConfigured(), false);
assert.equal(verifyPlatformCredentials("ops", "SirRelayAdmin1"), false);

process.env.PLATFORM_ADMIN_USERNAME = "ops";
process.env.PLATFORM_ADMIN_PASSWORD = "SirRelayAdmin1";
assert.equal(platformAdminConfigured(), true);
assert.equal(verifyPlatformCredentials("ops", "SirRelayAdmin1"), true);
assert.equal(verifyPlatformCredentials("ops", "wrong"), false);
assert.equal(verifyPlatformCredentials("other", "SirRelayAdmin1"), false);

console.log("check-platform-session: ok");
