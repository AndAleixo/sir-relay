/**
 * Platform admin data helpers (P2-AUD-04). Caller must gate with requirePlatformAdminSession.
 */
import type { UserPlan } from "@/domain/types";
import { prisma } from "@/lib/prisma";
import {
  addUtcMonth,
  effectivePlan,
  monthlyLimitFor,
  rollPlanPeriod,
} from "@/lib/ai-suggest-quota";

export type PlatformUserRow = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  plan: UserPlan;
  planExpiresAt: string | null;
  usagePeriodEnd: string;
  aiSuggestUsed: number;
  aiSuggestLimit: number;
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
    return [...MOCK_OPERATORS, ...MOCK_TEAMMATES].map((user) => {
      const plan: UserPlan = "free";
      const periodStart = new Date();
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        active: user.active,
        plan,
        planExpiresAt: null,
        usagePeriodEnd: addUtcMonth(periodStart).toISOString(),
        aiSuggestUsed: 0,
        aiSuggestLimit: monthlyLimitFor(plan),
      };
    });
  }

  const rows = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      plan: true,
      planExpiresAt: true,
      planPeriodStart: true,
      aiSuggestUsed: true,
    },
  });
  const now = new Date();
  return rows.map((row) => {
    const plan = effectivePlan(row.plan, row.planExpiresAt, now);
    const rolled = rollPlanPeriod(row.planPeriodStart, row.aiSuggestUsed, now);
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      active: row.active,
      plan,
      planExpiresAt:
        plan === "plus" && row.planExpiresAt
          ? row.planExpiresAt.toISOString()
          : null,
      usagePeriodEnd: addUtcMonth(rolled.periodStart).toISOString(),
      aiSuggestUsed: rolled.used,
      aiSuggestLimit: monthlyLimitFor(plan),
    };
  });
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
