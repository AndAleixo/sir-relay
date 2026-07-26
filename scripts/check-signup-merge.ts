/**
 * Self-check: signup merge for invited email (P1-AUTH-13) + entry routing (P1-AUTH-14).
 * Run: npx tsx scripts/check-signup-merge.ts
 */
import assert from "node:assert/strict";
import type { Session, Teammate } from "../src/domain/types";
import { resolveEntryPath } from "../src/lib/entry-route";
import { mockTeammateService } from "../src/services/mock/teammate.mock";
import {
  consumeAllInvitesForUser,
  getInviteTokenForUser,
  resolveInvite,
} from "../src/services/mock/tokens.mock";
import {
  findAnyMockUserByEmail,
  findMockUserByEmail,
  patchMockUser,
} from "../src/services/mock/users.mock";
import { mockGroupMembershipLookup } from "../src/services/mock/groups.mock";

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
  const email = `merge-${Date.now()}@example.com`;
  const created = await mockTeammateService.createTeammate({ email }, ctx);
  assert(created.ok && created.kind === "membership");
  assert.equal(created.teammate.accountStatus, "invited");

  const invite = await mockTeammateService.getInviteToken(created.teammate.id, ctx);
  assert(invite);
  assert(resolveInvite(invite));

  const placeholder = findAnyMockUserByEmail(email);
  assert(placeholder);
  assert.equal((placeholder as Teammate).accountStatus, "invited");

  // Mirror mock AuthService.signup merge (P1-AUTH-13) without Next cookies.
  const activated = patchMockUser(placeholder.id, {
    name: "Merged Person",
    mustChangePassword: false,
  });
  assert(activated);
  (activated as Teammate).accountStatus = "active";
  consumeAllInvitesForUser(placeholder.id);
  assert.equal(resolveInvite(invite), null);
  assert.equal(getInviteTokenForUser(placeholder.id), null);

  const fresh = findMockUserByEmail(email);
  assert(fresh);
  assert.equal(fresh.name, "Merged Person");
  assert.equal((fresh as Teammate).accountStatus, "active");
  assert(mockGroupMembershipLookup.hasMembership(fresh.id, "group-demo"));

  const afterMerge: Session = {
    user: { ...fresh, role: "teammate" },
    activeGroupId: "group-demo",
  };
  assert.equal(
    resolveEntryPath("en-gb", afterMerge),
    "/en-gb/tasks",
    "P1-AUTH-14: teammate with group → /tasks",
  );

  // Active email still blocked (operators / active teammates).
  assert.equal(findAnyMockUserByEmail("sam@example.com")?.email, "sam@example.com");
  assert.equal(
    "accountStatus" in (findAnyMockUserByEmail("ana@example.com") as object) &&
      (findAnyMockUserByEmail("ana@example.com") as Teammate).accountStatus,
    "active",
  );

  console.log("check-signup-merge: ok");
}

void main();
