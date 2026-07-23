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

/**
 * Create task: operators may assign anyone in group;
 * teammates may only create tasks assigned to themselves.
 */
export function assertCanCreateTask(session: Session, assigneeId: string): void {
  requireActiveGroupId(session);
  if (session.user.role === "operator") return;
  if (session.user.role === "teammate" && assigneeId === session.user.id) return;
  throw new Error("Forbidden");
}

/** Mutate task fields/status/delete: operators any in group; teammates only own. */
export function assertCanMutateTask(
  session: Session,
  task: { assigneeId: string },
): void {
  requireActiveGroupId(session);
  if (session.user.role === "operator") return;
  if (session.user.role === "teammate" && task.assigneeId === session.user.id) {
    return;
  }
  throw new Error("Forbidden");
}

/** Account-scoped mutations must target the signed-in user only. */
export function requireSelfUserId(session: Session, userId: string): void {
  if (session.user.id !== userId) throw new Error("Forbidden");
}
