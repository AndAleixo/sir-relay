import type { Role, Session } from "@/domain/types";

/** P2-SEC-01 — shared service-layer authz (throws `Forbidden` / `No active group`). */

export function requireActiveGroupId(session: Session): string {
  const groupId = session.activeGroupId;
  if (!groupId) throw new Error("No active group");
  return groupId;
}

export function requireSessionRole(session: Session, role: Role): void {
  if (session.user.role !== role) throw new Error("Forbidden");
}

export function requireOperator(session: Session): string {
  requireSessionRole(session, "operator");
  return requireActiveGroupId(session);
}

/** Account-scoped mutations must target the signed-in user only. */
export function requireSelfUserId(session: Session, userId: string): void {
  if (session.user.id !== userId) throw new Error("Forbidden");
}
