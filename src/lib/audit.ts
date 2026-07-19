/**
 * P2-AUD — append-only audit events. Never throws to callers (ops must not break UX).
 */
import type { Session } from "@/domain/types";
import type { AuditAction, AuditActorType, AuditEntry } from "@/domain/audit";
import { actorTypeFromRole, GROUP_ACTIVITY_ACTIONS } from "@/domain/audit";
import { prisma } from "@/lib/prisma";
import { logJson } from "@/lib/safe-log";
import type { Prisma } from "@prisma/client";

export type AuditWriteInput = {
  groupId?: string | null;
  action: AuditAction | string;
  actorType: AuditActorType;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
};

type MockRow = {
  id: string;
  groupId: string | null;
  action: string;
  actorType: AuditActorType;
  actorId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

/** ponytail: mock audit store resets with process; enough for UI smoke. */
const mockRows: MockRow[] = [];

function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_SERVICE_MODE === "mock";
}

export async function writeAudit(input: AuditWriteInput): Promise<void> {
  try {
    if (isMockMode()) {
      mockRows.unshift({
        id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        groupId: input.groupId ?? null,
        action: input.action,
        actorType: input.actorType,
        actorId: input.actorId ?? null,
        metadata: input.metadata ?? {},
        createdAt: new Date(),
      });
      return;
    }

    await prisma.auditLog.create({
      data: {
        groupId: input.groupId ?? null,
        action: input.action,
        actorType: input.actorType,
        actorId: input.actorId ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    logJson("error", "audit_write_failed", {
      action: input.action,
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}

export function writeAuditFromSession(
  session: Session,
  action: AuditAction | string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  return writeAudit({
    groupId: session.activeGroupId,
    action,
    actorType: actorTypeFromRole(session.user.role),
    actorId: session.user.id,
    metadata,
  });
}

export async function listAuditForGroup(
  groupId: string,
  opts: {
    page?: number;
    pageSize?: number;
    /** When true, only operator-facing group activity (no login/logout/password). */
    activityOnly?: boolean;
  } = {},
): Promise<{ entries: AuditEntry[]; total: number; page: number; pageSize: number }> {
  const pageSize = Math.min(Math.max(opts.pageSize ?? 30, 1), 100);
  const page = Math.max(opts.page ?? 1, 1);
  const skip = (page - 1) * pageSize;
  const actions = opts.activityOnly ? [...GROUP_ACTIVITY_ACTIONS] : null;

  if (isMockMode()) {
    const filtered = mockRows.filter(
      (row) =>
        row.groupId === groupId &&
        (actions == null || actions.includes(row.action as (typeof GROUP_ACTIVITY_ACTIONS)[number])),
    );
    const slice = filtered.slice(skip, skip + pageSize);
    return {
      entries: slice.map((row) => ({
        id: row.id,
        groupId: row.groupId,
        action: row.action,
        actorType: row.actorType,
        actorId: row.actorId,
        actorName: null,
        metadata: row.metadata,
        createdAt: row.createdAt.toISOString(),
      })),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  const where = {
    groupId,
    ...(actions ? { action: { in: actions } } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);

  return {
    entries: rows.map((row) => ({
      id: row.id,
      groupId: row.groupId,
      action: row.action,
      actorType: row.actorType,
      actorId: row.actorId,
      actorName: row.actor?.name || row.actor?.email || null,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  };
}

/** Resolve task titles + user names referenced in activity metadata. */
export async function resolveActivityLabels(
  entries: AuditEntry[],
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

  if (isMockMode() || (taskIds.size === 0 && userIds.size === 0)) {
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
