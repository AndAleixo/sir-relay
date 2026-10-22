import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_SERVICE_MODE ??= "mock";

async function main() {
  const {
    createClientApiKey,
    deleteClientApiKey,
    listClientApiKeys,
    userIdForLinkToken,
  } = await import("../src/lib/link-token");

  const userId = "user-link-token-check";

  assert.equal((await listClientApiKeys(userId)).length, 0);

  const created = await createClientApiKey(userId, {
    name: "MCP Casa",
    groupIds: ["group-a"],
  });
  assert.ok(!("error" in created));
  assert.equal(await userIdForLinkToken(created.token), userId);
  assert.equal((await listClientApiKeys(userId)).length, 1);
  assert.equal((await listClientApiKeys(userId))[0].name, "MCP Casa");
  assert.deepEqual((await listClientApiKeys(userId))[0].groupIds, ["group-a"]);

  const second = await createClientApiKey(userId, {
    name: "VS Code",
    groupIds: [],
  });
  assert.ok(!("error" in second));
  assert.equal((await listClientApiKeys(userId)).length, 2);
  assert.equal(await userIdForLinkToken(created.token), userId);
  assert.equal(await userIdForLinkToken(second.token), userId);

  assert.equal(await deleteClientApiKey(userId, created.key.id), true);
  assert.equal(await userIdForLinkToken(created.token), null);
  assert.equal(await userIdForLinkToken(second.token), userId);

  const bad = await createClientApiKey(userId, { name: "  " });
  assert.deepEqual(bad, { error: "bad_name" });

  console.log("check-link-token: ok");
}

void main();
