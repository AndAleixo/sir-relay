import type { Group, GroupInvitePreview, GroupMembership, Role } from "@/domain/types";
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

const extraGroups: Group[] = [];
const extraMemberships: GroupMembership[] = [];

function allMemberships(): GroupMembership[] {
  return [...MOCK_MEMBERSHIPS, ...extraMemberships];
}

function allGroups(): Group[] {
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
  extraMemberships.push({ groupId, userId, role });
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
  async listForUser(userId: string): Promise<Group[]> {
    return listGroupsForUser(userId);
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
    if (!membership) return null;

    return {
      groupId: group.id,
      groupName: group.name,
      email: user.email,
      role: membership.role,
      needsPassword: inviteNeedsPassword(record.userId),
    };
  }

  async acceptInvite(userId: string, token: string): Promise<Group> {
    const record = resolveInvite(token);
    if (!record) throw new Error("Invalid invite");

    if (record.userId !== userId) {
      throw new Error("Invite is for a different account");
    }

    const user = findMockUserById(userId);
    const group = getGroup(record.groupId);
    if (!user || !group) throw new Error("Invalid invite");

    if (!getMembership(userId, record.groupId)) {
      throw new Error("Invalid invite");
    }

    if ("accountStatus" in user) {
      (user as { accountStatus: string }).accountStatus = "active";
    }

    consumeInvite(token);
    return group;
  }
}

export const mockGroupService = new MockGroupService();
