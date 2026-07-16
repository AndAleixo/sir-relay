import assert from "node:assert/strict";
import type { Session } from "../src/domain/types";
import { mockTeammateService } from "../src/services/mock/teammate.mock";
import { resolveInvite } from "../src/services/mock/tokens.mock";
import { findAnyMockUserByEmail } from "../src/services/mock/users.mock";

const session: Session = {
  user: {
    id: "user-operator-2",
    name: "Sam",
    email: "sam@example.com",
    role: "operator",
    locale: "en-gb",
    active: true,
    mustChangePassword: false,
    telegramStatus: "linked",
  },
  activeGroupId: "group-demo",
};
const ctx = { session };

async function main() {
  const original = await mockTeammateService.getTeammate("user-bruno", ctx);
  assert(original);

  await mockTeammateService.removeTeammate(original.id, ctx);
  assert.equal(await mockTeammateService.getTeammate(original.id, ctx), null);

  const readded = await mockTeammateService.createTeammate(
    { name: original.name, email: original.email },
    ctx,
  );
  assert(readded.ok);
  assert.equal(readded.teammate.id, original.id);
  assert.equal(readded.teammate.active, true);

  assert.deepEqual(
    await mockTeammateService.createTeammate(
      { name: original.name, email: original.email },
      ctx,
    ),
    { ok: false, reason: "already_in_group" },
  );

  const email = `lifecycle-${Date.now()}@example.com`;
  const created = await mockTeammateService.createTeammate(
    { name: "Lifecycle Check", email },
    ctx,
  );
  assert(created.ok);

  const firstInvite = await mockTeammateService.getInviteToken(created.teammate.id, ctx);
  assert(firstInvite);
  assert(resolveInvite(firstInvite));
  assert.equal(
    await mockTeammateService.getInviteToken(created.teammate.id, ctx),
    null,
  );
  assert(resolveInvite(firstInvite), "reading must not invalidate an active invite");

  await mockTeammateService.regenerateInvite(created.teammate.id, ctx);
  assert.equal(resolveInvite(firstInvite), null);
  const replacement = await mockTeammateService.getInviteToken(created.teammate.id, ctx);
  assert(replacement);
  assert.notEqual(replacement, firstInvite);

  await mockTeammateService.removeTeammate(created.teammate.id, ctx);
  assert(findAnyMockUserByEmail(email), "removal must preserve the user account");

  console.log("teammate lifecycle checks ok");
}

void main();
