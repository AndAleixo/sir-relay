import type { Role, Session } from "@/domain/types";

/** Sync membership lookup — mock implements inline; API hydrates in auth.getSession(). */
export interface GroupMembershipLookup {
  pickDefaultGroupId(userId: string): string | null;
  roleInGroup(userId: string, groupId: string): Role | null;
  hasMembership(userId: string, groupId: string): boolean;
}

export type HydrateSessionOptions = {
  /** When false, keep activeGroupId null instead of auto-picking a single group. */
  autoPickGroup?: boolean;
};

/** Hydrate session: membership role + resume last/single group when none selected. */
export function hydrateSession(
  raw: Session,
  groups: GroupMembershipLookup,
  options: HydrateSessionOptions = {},
): Session | null {
  const { user } = raw;
  if (!user.active) return null;

  const autoPick = options.autoPickGroup !== false;
  let activeGroupId = raw.activeGroupId ?? null;
  if (!activeGroupId && autoPick) {
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
