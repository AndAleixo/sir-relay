import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_SERVICE_MODE ??= "mock";

async function main() {
  const {
    createClientApiKey,
    deleteClientApiKey,
    issueLinkToken,
    listClientApiKeys,
    userIdForLinkToken,
    EDITOR_API_KEY_NAME,
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

  const editorToken = await issueLinkToken(userId);
  assert.notEqual(editorToken, created.token);
  assert.equal(await userIdForLinkToken(created.token), userId);
  assert.equal(await userIdForLinkToken(editorToken), userId);
  const afterEditor = await listClientApiKeys(userId);
  assert.equal(afterEditor.length, 2);
  assert.ok(afterEditor.some((k) => k.name === EDITOR_API_KEY_NAME));

  const rotated = await issueLinkToken(userId);
  assert.equal(await userIdForLinkToken(editorToken), null);
  assert.equal(await userIdForLinkToken(rotated), userId);
  assert.equal(
    (await listClientApiKeys(userId)).filter((k) => k.name === EDITOR_API_KEY_NAME)
      .length,
    1,
  );

  assert.equal(await deleteClientApiKey(userId, created.key.id), true);
  assert.equal(await userIdForLinkToken(created.token), null);

  const bad = await createClientApiKey(userId, { name: "  " });
  assert.deepEqual(bad, { error: "bad_name" });

  console.log("check-link-token: ok");
}

void main();
