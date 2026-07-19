/**
 * Operator-facing group activity (`/events/activity`).
 * Subset of audit store actions — no login / logout / password / telegram_link.
 */
import type { AuditAction, AuditEntry } from "@/domain/audit";

export const GROUP_ACTIVITY_ACTIONS = [
  "task_create",
  "task_update",
  "task_delete",
  "task_status",
  "task_reassign",
  "task_renotify",
  "task_queue",
  "teammate_create",
  "teammate_remove",
  "teammate_promote",
  "invite_regenerate",
  "telegram_reply",
  "relay_dispatch",
  "export_data",
] as const satisfies readonly AuditAction[];

export type GroupActivityAction = (typeof GROUP_ACTIVITY_ACTIONS)[number];

/** Same row shape as the audit store; action is a group-activity code. */
export type GroupActivityEntry = AuditEntry & { action: GroupActivityAction | string };

export function isGroupActivityAction(action: string): action is GroupActivityAction {
  return (GROUP_ACTIVITY_ACTIONS as readonly string[]).includes(action);
}
