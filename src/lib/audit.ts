/**
 * Append-only audit store (`audit_logs`) — write path + low-level query.
 * Operator product UI must use `@/lib/activity`, not this module's query.
 */
import type { Session } from "@/domain/types";
import type { AuditAction, AuditActorType, AuditEntry } from "@/domain/audit";
import { actorTypeFromRole } from "@/domain/audit";
import { prisma } from "@/lib/prisma";
import { logJsonAsync } from "@/lib/safe-log";
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

/** ponytail: mock store resets with process; enough for smoke checks. */
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
    await logJsonAsync("error", "audit_write_failed", {
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

export type AuditQueryOpts = {
  /** Omit to query across all groups (incl. null groupId rows). */
  groupId?: string;
  /** When set, only these action codes (e.g. group activity subset). */
  actions?: readonly string[];
  /** Single action filter (admin UI). */
  action?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
};

function buildWhere(opts: AuditQueryOpts): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  if (opts.groupId !== undefined) where.groupId = opts.groupId;
  if (opts.actions?.length) where.action = { in: [...opts.actions] };
  else if (opts.action) where.action = opts.action;
  if (opts.actorId) where.actorId = opts.actorId;
  if (opts.from || opts.to) {
    where.createdAt = {
      ...(opts.from ? { gte: opts.from } : {}),
      ...(opts.to ? { lte: opts.to } : {}),
    };
  }
  return where;
}

/**
 * Low-level store read. Prefer `listGroupActivity` for operator UI.
 * Platform admin uses optional groupId / filters.
 */
export async function queryAuditLogs(
  opts: AuditQueryOpts = {},
): Promise<{
  entries: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const pageSize = Math.min(Math.max(opts.pageSize ?? 30, 1), 100);
  const page = Math.max(opts.page ?? 1, 1);
  const skip = (page - 1) * pageSize;
  const where = buildWhere(opts);

  if (isMockMode()) {
    const filtered = mockRows.filter((row) => {
      if (opts.groupId !== undefined && row.groupId !== opts.groupId) return false;
      if (opts.actions?.length && !opts.actions.includes(row.action)) return false;
      if (opts.action && row.action !== opts.action) return false;
      if (opts.actorId && row.actorId !== opts.actorId) return false;
      if (opts.from && row.createdAt < opts.from) return false;
      if (opts.to && row.createdAt > opts.to) return false;
      return true;
    });
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

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        actor: { select: { name: true, email: true } },
        group: { select: { name: true } },
      },
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
      metadata: {
        ...((row.metadata ?? {}) as Record<string, unknown>),
        ...(row.group?.name ? { _groupName: row.group.name } : {}),
      },
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  };
}

/** Counts for platform overview (last N days). */
export async function countAuditSince(
  since: Date,
  action?: string,
): Promise<number> {
  if (isMockMode()) {
    return mockRows.filter(
      (row) => row.createdAt >= since && (!action || row.action === action),
    ).length;
  }
  return prisma.auditLog.count({
    where: {
      createdAt: { gte: since },
      ...(action ? { action } : {}),
    },
  });
}

export async function countDistinctGroupsWithAuditSince(since: Date): Promise<number> {
  if (isMockMode()) {
    const ids = new Set(
      mockRows
        .filter((row) => row.createdAt >= since && row.groupId)
        .map((row) => row.groupId as string),
    );
    return ids.size;
  }
  const rows = await prisma.auditLog.findMany({
    where: { createdAt: { gte: since }, groupId: { not: null } },
    select: { groupId: true },
    distinct: ["groupId"],
  });
  return rows.length;
}
