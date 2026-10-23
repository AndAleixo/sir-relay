import assert from "node:assert/strict";
import {
  CLIENT_UPGRADE_MESSAGE,
  upgradeRequiredResponse,
} from "../src/lib/client-upgrade";

async function main() {
  assert.ok(/out of date/i.test(CLIENT_UPGRADE_MESSAGE));
  assert.ok(/update/i.test(CLIENT_UPGRADE_MESSAGE));
  assert.ok(!/\b1\.0\b/.test(CLIENT_UPGRADE_MESSAGE), "upgrade copy must stay version-agnostic");

  const res = upgradeRequiredResponse({ minClient: "2.0.0" });
  assert.equal(res.status, 410);
  const body = await res.json();
  assert.equal(body.error, "upgrade_required");
  assert.equal(body.message, CLIENT_UPGRADE_MESSAGE);
  assert.equal(body.minClient, "2.0.0");
  console.log("check-client-upgrade: ok");
}

void main();
