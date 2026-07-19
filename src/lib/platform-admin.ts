/**
 * Platform admin data helpers (P2-AUD-04). Caller must gate with requirePlatformAdminSession.
 */
import { prisma } from "@/lib/prisma";

export type PlatformUserRow = {
  id: string;
  name: string;
  email: string;
  active: boolean;
};

export type PlatformGroupRow = {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
};

export async function listPlatformUsers(): Promise<PlatformUserRow[]> {
  if (process.env.NEXT_PUBLIC_SERVICE_MODE === "mock") {
    const { MOCK_OPERATORS, MOCK_TEAMMATES } = await import(
      "@/services/mock/data"
    );
    return [...MOCK_OPERATORS, ...MOCK_TEAMMATES].map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      active: user.active,
    }));
  }

  const rows = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
    },
  });
  return rows;
}

export async function listPlatformGroups(): Promise<PlatformGroupRow[]> {
  if (process.env.NEXT_PUBLIC_SERVICE_MODE === "mock") {
    const { MOCK_GROUPS, MOCK_MEMBERSHIPS } = await import(
      "@/services/mock/groups.mock"
    );
    return MOCK_GROUPS.map((group) => ({
      id: group.id,
      name: group.name,
      memberCount: MOCK_MEMBERSHIPS.filter((m) => m.groupId === group.id).length,
      createdAt: new Date().toISOString(),
    }));
  }

  const rows = await prisma.group.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { memberships: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    memberCount: row._count.memberships,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function checkDatabaseHealth(): Promise<{
  ok: boolean;
  checkedAt: string;
}> {
  const checkedAt = new Date().toISOString();
  if (process.env.NEXT_PUBLIC_SERVICE_MODE === "mock") {
    return { ok: true, checkedAt };
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, checkedAt };
  } catch {
    return { ok: false, checkedAt };
  }
}
