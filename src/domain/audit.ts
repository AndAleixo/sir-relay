/**
 * Append-only security / ops journal (table `audit_logs`).
 * Platform admin reads this store; group operators never see it raw.
 * Product UI for operators: see `@/domain/activity` + `@/lib/activity`.
 */
import type { Role } from "@/domain/types";

export type AuditActorType = "operator" | "teammate" | "system";

/** All recorded action codes written to `audit_logs`. */
export type AuditAction =
  | "login"
  | "login_failed"
  | "logout"
  | "password_change"
  | "task_create"
  | "task_update"
  | "task_delete"
  | "task_status"
  | "task_reassign"
  | "task_renotify"
  | "task_queue"
  | "teammate_create"
  | "teammate_remove"
  | "teammate_promote"
  | "teammate_demote"
  | "group_ownership_transfer"
  | "invite_regenerate"
  | "telegram_link"
  | "telegram_reply"
  | "relay_dispatch"
  | "export_data";

export interface AuditEntry {
  id: string;
  groupId: string | null;
  action: string;
  actorType: AuditActorType;
  actorId: string | null;
  actorName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export function actorTypeFromRole(role: Role | null | undefined): AuditActorType {
  if (role === "operator") return "operator";
  if (role === "teammate") return "teammate";
  return "system";
}
