import type { Group, GroupInvitePreview, GroupMembership, Role, UserGroup } from "@/domain/types";
import type { GroupService } from "@/services/contracts";
import type { GroupMembershipLookup } from "@/lib/session-hydrate";
import { findMockUserById } from "@/services/mock/users.mock";
import {
  consumeInvite,
  resolveInvite,
} from "@/services/mock/tokens.mock";

export const MOCK_GROUPS: Group[] = [
  { id: "group-demo", name: "Demo Shop" },
  { id: "group-side", name: "Side Project" },
];

export const MOCK_MEMBERSHIPS: GroupMembership[] = [
  { groupId: "group-demo", userId: "user-operator-2", role: "operator" },
  { groupId: "group-side", userId: "user-operator-2", role: "operator" },
  { groupId: "group-demo", userId: "user-ana", role: "teammate" },
  { groupId: "group-demo", userId: "user-bruno", role: "teammate" },
  { groupId: "group-demo", userId: "user-carla", role: "teammate" },
];

// ponytail: globalThis so create/join survive Next.js splitting action vs RSC module instances (and HMR).
type MockGroupExtras = {
  extraGroups: Group[];
  extraMemberships: GroupMembership[];
};

function mockGroupExtras(): MockGroupExtras {
  const key = "__sirrelay_mock_group_extras__";
  const g = globalThis as typeof globalThis & {
    [k: string]: MockGroupExtras | undefined;
  };
  if (!g[key]) {
    g[key] = { extraGroups: [], extraMemberships: [] };
  }
  return g[key];
}

function allMemberships(): GroupMembership[] {
  const { extraMemberships } = mockGroupExtras();
  return [...MOCK_MEMBERSHIPS, ...extraMemberships];
}

function allGroups(): Group[] {
  const { extraGroups } = mockGroupExtras();
  return [...MOCK_GROUPS, ...extraGroups];
}

function getGroup(groupId: string): Group | null {
  return allGroups().find((group) => group.id === groupId) ?? null;
}

function listGroupsForUser(userId: string): Group[] {
  const ids = new Set(
    allMemberships()
      .filter((m) => m.userId === userId)
      .map((m) => m.groupId),
  );
  return allGroups().filter((g) => ids.has(g.id));
}

function getMembership(userId: string, groupId: string): GroupMembership | null {
  return (
    allMemberships().find((m) => m.userId === userId && m.groupId === groupId) ?? null
  );
}

function roleInGroup(userId: string, groupId: string): Role | null {
  return getMembership(userId, groupId)?.role ?? null;
}

function pickDefaultGroupId(userId: string): string | null {
  const groups = listGroupsForUser(userId);
  return groups.length === 1 ? groups[0].id : null;
}

function inviteNeedsPassword(userId: string): boolean {
  const user = findMockUserById(userId);
  if (!user) return true;
  if ("accountStatus" in user) {
    return (user as { accountStatus: string }).accountStatus === "invited";
  }
  return false;
}

function createGroupForUser(userId: string, name: string): Group {
  const { extraGroups, extraMemberships } = mockGroupExtras();
  const group: Group = {
    id: `group-${Date.now().toString(36)}`,
    name: name.trim(),
  };
  extraGroups.push(group);
  extraMemberships.push({ groupId: group.id, userId, role: "operator" });
  return group;
}

/** Used by teammate mock when creating invite-only members. */
export function addGroupMember(
  groupId: string,
  userId: string,
  role: Role,
): void {
  if (getMembership(userId, groupId)) return;
  mockGroupExtras().extraMemberships.push({ groupId, userId, role });
}

export function userIdsInGroup(groupId: string): Set<string> {
  return new Set(
    allMemberships()
      .filter((m) => m.groupId === groupId)
      .map((m) => m.userId),
  );
}

export const mockGroupMembershipLookup: GroupMembershipLookup = {
  pickDefaultGroupId,
  roleInGroup,
  hasMembership: (userId, groupId) => Boolean(getMembership(userId, groupId)),
};

export class MockGroupService implements GroupService {
  async listForUser(userId: string): Promise<UserGroup[]> {
    return listGroupsForUser(userId).map((group) => ({
      ...group,
      role: roleInGroup(userId, group.id) ?? "teammate",
    }));
  }

  async create(userId: string, name: string): Promise<Group> {
    return createGroupForUser(userId, name);
  }

  async roleInGroup(userId: string, groupId: string): Promise<Role | null> {
    return roleInGroup(userId, groupId);
  }

  async isMember(userId: string, groupId: string): Promise<boolean> {
    return Boolean(getMembership(userId, groupId));
  }

  async previewInvite(token: string): Promise<GroupInvitePreview | null> {
    const record = resolveInvite(token);
    if (!record) return null;

    const user = findMockUserById(record.userId);
    const group = getGroup(record.groupId);
    if (!user || !group) return null;

    const membership = getMembership(record.userId, record.groupId);

    return {
      groupId: group.id,
      groupName: group.name,
      email: user.email,
      role: membership?.role ?? "teammate",
      needsPassword: inviteNeedsPassword(record.userId),
    };
  }

  async acceptInvite(userId: string, token: string): Promise<Group> {
    const record = resolveInvite(token);
    if (!record) throw new Error("Invalid invite");

    const user = findMockUserById(userId);
    const invitedUser = findMockUserById(record.userId);
    const group = getGroup(record.groupId);
    if (!user || !invitedUser || !group) throw new Error("Invalid invite");

    if (user.email.toLowerCase() !== invitedUser.email.toLowerCase()) {
      throw new Error("Invite is for a different account");
    }

    if (!getMembership(userId, record.groupId)) {
      addGroupMember(record.groupId, userId, "teammate");
    }

    if ("accountStatus" in user) {
      (user as { accountStatus: string }).accountStatus = "active";
    }

    consumeInvite(token);
    return group;
  }
}

export const mockGroupService = new MockGroupService();

// ponytail: self-check — runtime create visible to membership lookup
if (process.env.NODE_ENV !== "production") {
  const uid = "__mock_group_selfcheck__";
  const before = mockGroupMembershipLookup.hasMembership(uid, "group-nope");
  const g = createGroupForUser(uid, "SelfCheck");
  const ok =
    !before &&
    mockGroupMembershipLookup.hasMembership(uid, g.id) &&
    listGroupsForUser(uid).some((x) => x.id === g.id);
  if (!ok) console.error("groups.mock create self-check failed");
}
