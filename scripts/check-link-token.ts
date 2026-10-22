import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_SERVICE_MODE ??= "mock";

async function main() {
  const {
    hasLinkToken,
    issueLinkToken,
    revokeLinkToken,
    userIdForLinkToken,
  } = await import("../src/lib/link-token");

  const userId = "user-link-token-check";

  assert.equal(await hasLinkToken(userId), false);
  const token = await issueLinkToken(userId);
  assert.ok(token.length > 10);
  assert.equal(await hasLinkToken(userId), true);
  assert.equal(await userIdForLinkToken(token), userId);

  const rotated = await issueLinkToken(userId);
  assert.notEqual(rotated, token);
  assert.equal(await userIdForLinkToken(token), null);
  assert.equal(await userIdForLinkToken(rotated), userId);

  await revokeLinkToken(userId);
  assert.equal(await hasLinkToken(userId), false);
  assert.equal(await userIdForLinkToken(rotated), null);

  console.log("check-link-token: ok");
}

void main();
