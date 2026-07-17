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

function removedMembershipKeys(): Set<string> {
  const key = "__sirrelay_mock_removed_memberships__";
  const g = globalThis as typeof globalThis & {
    [k: string]: Set<string> | undefined;
  };
  if (!g[key]) g[key] = new Set();
  return g[key];
}

function deletedGroupIds(): Set<string> {
  const key = "__sirrelay_mock_deleted_groups__";
  const g = globalThis as typeof globalThis & {
    [k: string]: Set<string> | undefined;
  };
  if (!g[key]) g[key] = new Set();
  return g[key];
}

function membershipKey(groupId: string, userId: string) {
  return `${groupId}:${userId}`;
}

function allMemberships(): GroupMembership[] {
  const { extraMemberships } = mockGroupExtras();
  const removed = removedMembershipKeys();
  const deleted = deletedGroupIds();
  return [...MOCK_MEMBERSHIPS, ...extraMemberships].filter(
    (membership) =>
      !removed.has(membershipKey(membership.groupId, membership.userId)) &&
      !deleted.has(membership.groupId),
  );
}

function allGroups(): Group[] {
  const { extraGroups } = mockGroupExtras();
  const deleted = deletedGroupIds();
  return [...MOCK_GROUPS, ...extraGroups].filter((group) => !deleted.has(group.id));
}

function getGroup(groupId: string): Group | null {
  return allGroups().find((group) => group.id === groupId) ?? null;
}

export function findMockGroupById(groupId: string): Group | null {
  return getGroup(groupId);
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
  if (groups.length === 1) return groups[0].id;
  const last = lastActiveGroupByUser().get(userId);
  if (last && groups.some((group) => group.id === last)) return last;
  return null;
}

function lastActiveGroupByUser(): Map<string, string> {
  const key = "__sirrelay_mock_last_active_group__";
  const g = globalThis as typeof globalThis & {
    [k: string]: Map<string, string> | undefined;
  };
  if (!g[key]) g[key] = new Map();
  return g[key];
}

export function rememberMockLastActiveGroup(userId: string, groupId: string) {
  lastActiveGroupByUser().set(userId, groupId);
}

export function clearMockLastActiveGroup(userId: string, groupId?: string) {
  const map = lastActiveGroupByUser();
  if (!groupId || map.get(userId) === groupId) {
    map.delete(userId);
  }
}

function clearMockLastActiveGroupForGroup(groupId: string) {
  for (const [userId, activeGroupId] of Array.from(lastActiveGroupByUser().entries())) {
    if (activeGroupId === groupId) {
      lastActiveGroupByUser().delete(userId);
    }
  }
}

export function setMemberRole(groupId: string, userId: string, role: Role): void {
  const membership = getMembership(userId, groupId);
  if (!membership) throw new Error("Not a member");
  membership.role = role;
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
  displayName: string | null = null,
): void {
  if (getMembership(userId, groupId)) return;
  removedMembershipKeys().delete(membershipKey(groupId, userId));
  mockGroupExtras().extraMemberships.push({
    groupId,
    userId,
    role,
    displayName,
  });
}

export function setMembershipDisplayName(
  groupId: string,
  userId: string,
  displayName: string | null,
): void {
  const membership = getMembership(userId, groupId);
  if (!membership) throw new Error("Membership not found");
  membership.displayName = displayName?.trim() || null;
}

export function getMembershipDisplayName(
  groupId: string,
  userId: string,
): string | null {
  return getMembership(userId, groupId)?.displayName ?? null;
}

export function removeGroupMember(groupId: string, userId: string): void {
  if (!getMembership(userId, groupId)) return;
  removedMembershipKeys().add(membershipKey(groupId, userId));
  const { extraMemberships } = mockGroupExtras();
  const index = extraMemberships.findIndex(
    (row) => row.groupId === groupId && row.userId === userId,
  );
  if (index >= 0) extraMemberships.splice(index, 1);
  clearMockLastActiveGroup(userId, groupId);
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

  async pickResumeGroupId(userId: string): Promise<string | null> {
    return pickDefaultGroupId(userId);
  }

  async renameGroup(userId: string, groupId: string, name: string): Promise<Group> {
    const role = await this.roleInGroup(userId, groupId);
    if (role !== "operator") throw new Error("forbidden");

    const trimmed = name.trim();
    if (trimmed.length < 2) throw new Error("short");

    const group = getGroup(groupId);
    if (!group) throw new Error("not_member");
    group.name = trimmed;
    return { ...group };
  }

  async countMembers(groupId: string): Promise<number> {
    return allMemberships().filter((row) => row.groupId === groupId).length;
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const membership = getMembership(userId, groupId);
    if (!membership) throw new Error("not_member");

    const members = allMemberships().filter((row) => row.groupId === groupId);
    const operators = members.filter((row) => row.role === "operator");
    if (membership.role === "operator" && operators.length === 1 && members.length > 1) {
      throw new Error("last_operator");
    }

    const { removeMockTasksAssignedTo } = await import("@/services/mock/task.mock");
    removeMockTasksAssignedTo(userId);
    removedMembershipKeys().add(membershipKey(groupId, userId));
    const { extraMemberships } = mockGroupExtras();
    const idx = extraMemberships.findIndex(
      (row) => row.userId === userId && row.groupId === groupId,
    );
    if (idx >= 0) extraMemberships.splice(idx, 1);
    clearMockLastActiveGroup(userId, groupId);

    if (allMemberships().filter((row) => row.groupId === groupId).length === 0) {
      deletedGroupIds().add(groupId);
    }
  }

  async deleteGroup(userId: string, groupId: string): Promise<void> {
    const role = await this.roleInGroup(userId, groupId);
    if (role !== "operator") throw new Error("forbidden");
    clearMockLastActiveGroupForGroup(groupId);
    deletedGroupIds().add(groupId);
    const { extraGroups, extraMemberships } = mockGroupExtras();
    for (let i = extraGroups.length - 1; i >= 0; i -= 1) {
      if (extraGroups[i].id === groupId) extraGroups.splice(i, 1);
    }
    for (let i = extraMemberships.length - 1; i >= 0; i -= 1) {
      if (extraMemberships[i].groupId === groupId) extraMemberships.splice(i, 1);
    }
    for (const member of MOCK_MEMBERSHIPS.filter((row) => row.groupId === groupId)) {
      removedMembershipKeys().add(membershipKey(groupId, member.userId));
    }
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
