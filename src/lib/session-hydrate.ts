import type { Role, Session } from "@/domain/types";

/** Sync membership lookup — mock implements inline; API hydrates in auth.getSession(). */
export interface GroupMembershipLookup {
  pickDefaultGroupId(userId: string): string | null;
  roleInGroup(userId: string, groupId: string): Role | null;
  hasMembership(userId: string, groupId: string): boolean;
}

/** Hydrate session: membership role + auto-select when user has exactly one group. */
export function hydrateSession(
  raw: Session,
  groups: GroupMembershipLookup,
): Session | null {
  const { user } = raw;
  if (!user.active) return null;

  let activeGroupId = raw.activeGroupId ?? null;
  if (!activeGroupId) {
    activeGroupId = groups.pickDefaultGroupId(user.id);
  }

  if (!activeGroupId) {
    return { user: { ...user }, activeGroupId: null };
  }

  const role = groups.roleInGroup(user.id, activeGroupId);
  if (!role || !groups.hasMembership(user.id, activeGroupId)) {
    return { user: { ...user }, activeGroupId: null };
  }

  return {
    user: { ...user, role },
    activeGroupId,
  };
}
