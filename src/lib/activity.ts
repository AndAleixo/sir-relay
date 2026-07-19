/**
 * Operator group activity for `/events/activity`.
 * Reads a filtered slice of the audit store; presents human-readable lines.
 */
import type { GroupActivityEntry } from "@/domain/activity";
import { GROUP_ACTIVITY_ACTIONS, isGroupActivityAction } from "@/domain/activity";
import { queryAuditLogs } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export type ActivityMessage = {
  key: string;
  values: Record<string, string>;
};

export async function listGroupActivity(
  groupId: string,
  opts: { page?: number; pageSize?: number } = {},
): Promise<{
  entries: GroupActivityEntry[];
  total: number;
  page: number;
  pageSize: number;
}> {
  return queryAuditLogs({
    groupId,
    actions: GROUP_ACTIVITY_ACTIONS,
    page: opts.page,
    pageSize: opts.pageSize,
  });
}

/** Resolve task titles + user names referenced in activity metadata. */
export async function resolveActivityLabels(
  entries: GroupActivityEntry[],
): Promise<{ taskTitles: Map<string, string>; userNames: Map<string, string> }> {
  const taskIds = new Set<string>();
  const userIds = new Set<string>();

  for (const entry of entries) {
    const meta = entry.metadata;
    if (typeof meta.taskId === "string") taskIds.add(meta.taskId);
    if (typeof meta.assigneeId === "string") userIds.add(meta.assigneeId);
    if (typeof meta.toAssigneeId === "string") userIds.add(meta.toAssigneeId);
    if (typeof meta.userId === "string") userIds.add(meta.userId);
  }

  const taskTitles = new Map<string, string>();
  const userNames = new Map<string, string>();

  if (
    process.env.NEXT_PUBLIC_SERVICE_MODE === "mock" ||
    (taskIds.size === 0 && userIds.size === 0)
  ) {
    return { taskTitles, userNames };
  }

  const [tasks, users] = await Promise.all([
    taskIds.size
      ? prisma.task.findMany({
          where: { id: { in: Array.from(taskIds) } },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
    userIds.size
      ? prisma.user.findMany({
          where: { id: { in: Array.from(userIds) } },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
  ]);

  for (const task of tasks) taskTitles.set(task.id, task.title);
  for (const user of users) {
    userNames.set(user.id, user.name.trim() || user.email);
  }
  return { taskTitles, userNames };
}

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

/** Map a store row to an i18n message key under `events.activity.*`. */
export function describeGroupActivity(
  entry: GroupActivityEntry,
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
      const toName = personLabel(meta, "toAssigneeId", ctx.userNames);
      const assignee =
        toName !== "—" ? toName : personLabel(meta, "assigneeId", ctx.userNames);
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
