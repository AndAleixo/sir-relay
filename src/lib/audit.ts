/**
 * P2-AUD — append-only audit events. Never throws to callers (ops must not break UX).
 */
import type { Session } from "@/domain/types";
import type { AuditAction, AuditActorType, AuditEntry } from "@/domain/audit";
import { actorTypeFromRole } from "@/domain/audit";
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
  opts: { page?: number; pageSize?: number } = {},
): Promise<{ entries: AuditEntry[]; total: number; page: number; pageSize: number }> {
  const pageSize = Math.min(Math.max(opts.pageSize ?? 30, 1), 100);
  const page = Math.max(opts.page ?? 1, 1);
  const skip = (page - 1) * pageSize;

  if (isMockMode()) {
    const filtered = mockRows.filter((row) => row.groupId === groupId);
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

  const where = { groupId };
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
