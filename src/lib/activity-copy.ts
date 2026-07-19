/**
 * Human-readable group activity lines for /events/activity (operator UI).
 */
import type { AuditEntry } from "@/domain/audit";
import { isGroupActivityAction } from "@/domain/audit";

export type ActivityMessage = {
  key: string;
  values: Record<string, string>;
};

function str(meta: Record<string, unknown>, key: string): string | null {
  const value = meta[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function taskLabel(
  meta: Record<string, unknown>,
  titles: Map<string, string>,
): string {
  const title = str(meta, "title");
  if (title) return title;
  const taskId = str(meta, "taskId");
  if (taskId && titles.has(taskId)) return titles.get(taskId)!;
  return "—";
}

function personLabel(
  meta: Record<string, unknown>,
  key: string,
  names: Map<string, string>,
): string {
  const id = str(meta, key);
  if (id && names.has(id)) return names.get(id)!;
  return "—";
}

export function describeGroupActivity(
  entry: AuditEntry,
  ctx: {
    taskTitles: Map<string, string>;
    userNames: Map<string, string>;
    statusLabel: (status: string) => string;
  },
): ActivityMessage | null {
  if (!isGroupActivityAction(entry.action)) return null;

  const actor = entry.actorName?.trim() || entry.actorType;
  const meta = entry.metadata;
  const task = taskLabel(meta, ctx.taskTitles);

  switch (entry.action) {
    case "task_create":
      return { key: "task_create", values: { actor, task } };
    case "task_update":
      return { key: "task_update", values: { actor, task } };
    case "task_delete":
      return { key: "task_delete", values: { actor, task } };
    case "task_status": {
      const from = str(meta, "from") ?? "";
      const to = str(meta, "to") ?? "";
      return {
        key: "task_status",
        values: {
          actor,
          task,
          from: ctx.statusLabel(from),
          to: ctx.statusLabel(to),
        },
      };
    }
    case "task_reassign": {
      const assignee =
        personLabel(meta, "toAssigneeId", ctx.userNames) !== "—"
          ? personLabel(meta, "toAssigneeId", ctx.userNames)
          : personLabel(meta, "assigneeId", ctx.userNames);
      return { key: "task_reassign", values: { actor, task, assignee } };
    }
    case "task_renotify":
      return { key: "task_renotify", values: { actor, task } };
    case "task_queue":
      return {
        key: "task_queue",
        values: {
          actor,
          task,
          assignee: personLabel(meta, "assigneeId", ctx.userNames),
        },
      };
    case "teammate_create": {
      const kind = str(meta, "kind");
      if (kind === "invitation") {
        return {
          key: "teammate_invite",
          values: { actor, person: personLabel(meta, "userId", ctx.userNames) },
        };
      }
      return {
        key: "teammate_add",
        values: { actor, person: personLabel(meta, "userId", ctx.userNames) },
      };
    }
    case "teammate_remove":
      return {
        key: "teammate_remove",
        values: { actor, person: personLabel(meta, "userId", ctx.userNames) },
      };
    case "teammate_promote":
      return {
        key: "teammate_promote",
        values: { actor, person: personLabel(meta, "userId", ctx.userNames) },
      };
    case "invite_regenerate":
      return {
        key: "invite_regenerate",
        values: { actor, person: personLabel(meta, "userId", ctx.userNames) },
      };
    case "telegram_reply": {
      const status = str(meta, "status");
      if (status) {
        return {
          key: "telegram_reply_status",
          values: { actor, task, status: ctx.statusLabel(status) },
        };
      }
      return { key: "telegram_reply", values: { actor, task } };
    }
    case "relay_dispatch":
      return { key: "relay_dispatch", values: { actor, task } };
    case "export_data": {
      const scope = str(meta, "scope");
      if (scope === "user") {
        return {
          key: "export_user",
          values: { actor, person: personLabel(meta, "userId", ctx.userNames) },
        };
      }
      return { key: "export_full", values: { actor } };
    }
    default:
      return null;
  }
}
