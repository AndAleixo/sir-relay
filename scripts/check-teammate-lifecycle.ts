import assert from "node:assert/strict";
import type { Session } from "../src/domain/types";
import { groupMemberLabel } from "../src/lib/group-member-label";
import { mockTeammateService } from "../src/services/mock/teammate.mock";
import { countMockTasksAssignedTo } from "../src/services/mock/task.mock";
import { mockGroupInvitationService } from "../src/services/mock/invitations.mock";
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
  assert.equal(
    groupMemberLabel({ name: "", email: "a@b.com", displayName: null }),
    "a@b.com",
  );
  assert.equal(
    groupMemberLabel({ name: "Ana", email: "a@b.com", displayName: "Line 1" }),
    "Line 1",
  );

  const original = await mockTeammateService.getTeammate("user-bruno", ctx);
  assert(original);
  assert(countMockTasksAssignedTo(original.id) > 0);

  await mockTeammateService.removeTeammate(original.id, ctx);
  assert.equal(await mockTeammateService.getTeammate(original.id, ctx), null);
  assert.equal(countMockTasksAssignedTo(original.id), 0);

  const readded = await mockTeammateService.createTeammate(
    { email: original.email },
    ctx,
  );
  assert(readded.ok && readded.kind === "invitation");
  assert.equal(await mockTeammateService.getTeammate(original.id, ctx), null);
  assert.equal(
    (await mockGroupInvitationService.listForUser(original.id)).length,
    1,
  );
  const duplicateRequest = await mockTeammateService.createTeammate(
    { email: original.email },
    ctx,
  );
  assert(duplicateRequest.ok && duplicateRequest.kind === "invitation");
  assert.equal(duplicateRequest.invitation.id, readded.invitation.id);

  await assert.rejects(
    mockGroupInvitationService.accept(readded.invitation.id, "user-ana"),
    /invitation_invalid/,
  );
  const concurrentAccepts = await Promise.allSettled([
    mockGroupInvitationService.accept(readded.invitation.id, original.id),
    mockGroupInvitationService.accept(readded.invitation.id, original.id),
  ]);
  assert.equal(
    concurrentAccepts.filter(({ status }) => status === "fulfilled").length,
    1,
  );
  assert(await mockTeammateService.getTeammate(original.id, ctx));

  assert.deepEqual(
    await mockTeammateService.createTeammate({ email: original.email }, ctx),
    { ok: false, reason: "already_in_group" },
  );

  await mockTeammateService.updateTeammate(
    original.id,
    { displayName: "Bruno Fantasy" },
    ctx,
  );
  const labeled = await mockTeammateService.getTeammate(original.id, ctx);
  assert(labeled);
  assert.equal(groupMemberLabel(labeled), "Bruno Fantasy");
  assert.equal(labeled.name, original.name);

  await mockTeammateService.removeTeammate(original.id, ctx);
  const declinedRequest = await mockTeammateService.createTeammate(
    { email: original.email },
    ctx,
  );
  assert(declinedRequest.ok && declinedRequest.kind === "invitation");
  await mockGroupInvitationService.decline(
    declinedRequest.invitation.id,
    original.id,
  );
  assert.equal(
    (await mockGroupInvitationService.listForUser(original.id)).length,
    0,
  );
  await mockGroupInvitationService.resend(declinedRequest.invitation.id, ctx);
  assert.equal(
    (await mockGroupInvitationService.listForUser(original.id)).length,
    1,
  );

  const email = `lifecycle-${Date.now()}@example.com`;
  const created = await mockTeammateService.createTeammate({ email }, ctx);
  assert(created.ok && created.kind === "membership");
  assert.equal(created.teammate.name, "");
  assert.equal(groupMemberLabel(created.teammate), email);

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
