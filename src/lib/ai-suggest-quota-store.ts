/**
 * Persist AI suggest usage on the user row (api) or process Map (mock).
 */
import { prisma } from "@/lib/prisma";
import type { UserPlan } from "@/domain/types";
import {
  addUtcDays,
  addUtcMonth,
  DEFAULT_PLUS_DAYS,
  effectivePlan,
  monthlyLimitFor,
  rollPlanPeriod,
} from "@/lib/ai-suggest-quota";

export type AiSuggestQuotaSnapshot = {
  plan: UserPlan;
  used: number;
  limit: number;
  remaining: number;
  periodStart: Date;
  periodEnd: Date;
  planExpiresAt: Date | null;
};

type QuotaRow = {
  plan: UserPlan;
  planExpiresAt: Date | null;
  planPeriodStart: Date;
  aiSuggestUsed: number;
};

const mockQuota = new Map<string, QuotaRow>();

function snapshot(row: QuotaRow, now = new Date()): AiSuggestQuotaSnapshot {
  const plan = effectivePlan(row.plan, row.planExpiresAt, now);
  const rolled = rollPlanPeriod(row.planPeriodStart, row.aiSuggestUsed, now);
  const limit = monthlyLimitFor(plan);
  return {
    plan,
    used: rolled.used,
    limit,
    remaining: Math.max(0, limit - rolled.used),
    periodStart: rolled.periodStart,
    periodEnd: addUtcMonth(rolled.periodStart),
    planExpiresAt: plan === "plus" ? row.planExpiresAt : null,
  };
}

function isMock(): boolean {
  return process.env.NEXT_PUBLIC_SERVICE_MODE === "mock";
}

async function readRow(userId: string): Promise<QuotaRow | null> {
  if (isMock()) {
    return (
      mockQuota.get(userId) ?? {
        plan: "free",
        planExpiresAt: null,
        planPeriodStart: new Date(),
        aiSuggestUsed: 0,
      }
    );
  }
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      planExpiresAt: true,
      planPeriodStart: true,
      aiSuggestUsed: true,
    },
  });
  if (!row) return null;
  return {
    plan: row.plan,
    planExpiresAt: row.planExpiresAt,
    planPeriodStart: row.planPeriodStart,
    aiSuggestUsed: row.aiSuggestUsed,
  };
}

async function writeRow(
  userId: string,
  data: {
    plan?: UserPlan;
    planExpiresAt?: Date | null;
    planPeriodStart: Date;
    aiSuggestUsed: number;
  },
): Promise<void> {
  if (isMock()) {
    const prev = mockQuota.get(userId) ?? {
      plan: "free" as UserPlan,
      planExpiresAt: null as Date | null,
      planPeriodStart: new Date(),
      aiSuggestUsed: 0,
    };
    mockQuota.set(userId, {
      plan: data.plan ?? prev.plan,
      planExpiresAt:
        data.planExpiresAt !== undefined ? data.planExpiresAt : prev.planExpiresAt,
      planPeriodStart: data.planPeriodStart,
      aiSuggestUsed: data.aiSuggestUsed,
    });
    return;
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.plan ? { plan: data.plan } : {}),
      ...(data.planExpiresAt !== undefined
        ? { planExpiresAt: data.planExpiresAt }
        : {}),
      planPeriodStart: data.planPeriodStart,
      aiSuggestUsed: data.aiSuggestUsed,
    },
  });
}

/** Demote expired plus → free; persist if needed. */
async function syncEffectivePlan(userId: string, row: QuotaRow): Promise<QuotaRow> {
  const now = new Date();
  const plan = effectivePlan(row.plan, row.planExpiresAt, now);
  if (plan === row.plan) return row;
  const next: QuotaRow = {
    plan: "free",
    planExpiresAt: null,
    planPeriodStart: now,
    aiSuggestUsed: 0,
  };
  await writeRow(userId, {
    plan: next.plan,
    planExpiresAt: null,
    planPeriodStart: next.planPeriodStart,
    aiSuggestUsed: 0,
  });
  return next;
}

/** Current quota for UI (rolls period; demotes expired plus). */
export async function getAiSuggestQuota(
  userId: string,
): Promise<AiSuggestQuotaSnapshot | null> {
  const raw = await readRow(userId);
  if (!raw) return null;
  const row = await syncEffectivePlan(userId, raw);
  const snap = snapshot(row);
  if (
    snap.periodStart.getTime() !== row.planPeriodStart.getTime() ||
    snap.used !== row.aiSuggestUsed
  ) {
    await writeRow(userId, {
      planPeriodStart: snap.periodStart,
      aiSuggestUsed: snap.used,
    });
  }
  return snap;
}

/**
 * Reserve one suggest credit. Fails with quota if none left.
 * Call before OpenAI; refund on upstream failure.
 */
export async function consumeAiSuggestQuota(
  userId: string,
): Promise<
  | { ok: true; quota: AiSuggestQuotaSnapshot }
  | { ok: false; error: "not_found" | "quota"; quota?: AiSuggestQuotaSnapshot }
> {
  const raw = await readRow(userId);
  if (!raw) return { ok: false, error: "not_found" };
  const row = await syncEffectivePlan(userId, raw);
  const rolled = rollPlanPeriod(row.planPeriodStart, row.aiSuggestUsed);
  const plan = effectivePlan(row.plan, row.planExpiresAt);
  const limit = monthlyLimitFor(plan);
  if (rolled.used >= limit) {
    return {
      ok: false,
      error: "quota",
      quota: snapshot({ ...row, plan, ...rolled }),
    };
  }
  const nextUsed = rolled.used + 1;
  await writeRow(userId, {
    planPeriodStart: rolled.periodStart,
    aiSuggestUsed: nextUsed,
  });
  return {
    ok: true,
    quota: snapshot({
      plan,
      planExpiresAt: row.planExpiresAt,
      planPeriodStart: rolled.periodStart,
      aiSuggestUsed: nextUsed,
    }),
  };
}

/** Best-effort refund after a failed suggest that already consumed. */
export async function refundAiSuggestQuota(userId: string): Promise<void> {
  const row = await readRow(userId);
  if (!row) return;
  const rolled = rollPlanPeriod(row.planPeriodStart, row.aiSuggestUsed);
  await writeRow(userId, {
    planPeriodStart: rolled.periodStart,
    aiSuggestUsed: Math.max(0, rolled.used - 1),
  });
}

export type SetUserPlanInput = {
  plan: UserPlan;
  /** Absolute end for plus. Ignored for free. If plus and omitted → now+DEFAULT_PLUS_DAYS. */
  planExpiresAt?: Date | null;
};

/** Platform: set plan (+ optional expiry) and reset the usage month. */
export async function setUserPlan(
  userId: string,
  input: SetUserPlanInput,
): Promise<AiSuggestQuotaSnapshot | null> {
  if (!isMock()) {
    const exists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!exists) return null;
  }
  const now = new Date();
  const plan = input.plan;
  let planExpiresAt: Date | null = null;
  if (plan === "plus") {
    planExpiresAt =
      input.planExpiresAt ?? addUtcDays(now, DEFAULT_PLUS_DAYS);
  }
  await writeRow(userId, {
    plan,
    planExpiresAt,
    planPeriodStart: now,
    aiSuggestUsed: 0,
  });
  return snapshot({
    plan,
    planExpiresAt,
    planPeriodStart: now,
    aiSuggestUsed: 0,
  });
}

/** Seed mock quota (tests / mock mode). */
export function seedMockAiSuggestQuota(
  userId: string,
  row: Partial<QuotaRow> & { plan?: UserPlan } = {},
): void {
  mockQuota.set(userId, {
    plan: row.plan ?? "free",
    planExpiresAt: row.planExpiresAt ?? null,
    planPeriodStart: row.planPeriodStart ?? new Date(),
    aiSuggestUsed: row.aiSuggestUsed ?? 0,
  });
}
