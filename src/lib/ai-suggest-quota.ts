/**
 * AI suggest quotas by user plan (DB-backed).
 * Usage month rolls from planPeriodStart; plus ends at planExpiresAt → free.
 */
import type { UserPlan } from "@/domain/types";

export const AI_SUGGEST_TEXT_MAX = 300;
export const AI_SUGGEST_TASKS_MAX = 5;

/** Default plus grant when platform does not pick a custom end date. */
export const DEFAULT_PLUS_DAYS = 30;

export const AI_SUGGEST_MONTHLY_LIMIT: Record<UserPlan, number> = {
  free: 5,
  plus: 30,
};

export const USER_PLANS: readonly UserPlan[] = ["free", "plus"];

export function isUserPlan(value: string): value is UserPlan {
  return value === "free" || value === "plus";
}

/** Advance by one calendar month in UTC (usage-period step). */
export function addUtcMonth(from: Date, months = 1): Date {
  const next = new Date(from.getTime());
  const day = next.getUTCDate();
  next.setUTCMonth(next.getUTCMonth() + months, 1);
  const maxDay = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
  ).getUTCDate();
  next.setUTCDate(Math.min(day, maxDay));
  return next;
}

export function addUtcDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Roll planPeriodStart forward until `now` is inside the open month;
 * resets used count when the period advances.
 */
export function rollPlanPeriod(
  periodStart: Date,
  used: number,
  now: Date = new Date(),
): { periodStart: Date; used: number } {
  let start = periodStart;
  let count = used;
  let guard = 0;
  while (now.getTime() >= addUtcMonth(start).getTime() && guard < 1200) {
    start = addUtcMonth(start);
    count = 0;
    guard += 1;
  }
  return { periodStart: start, used: count };
}

export function monthlyLimitFor(plan: UserPlan): number {
  return AI_SUGGEST_MONTHLY_LIMIT[plan];
}

/** Plus with a past expiry should become free. */
export function effectivePlan(
  plan: UserPlan,
  planExpiresAt: Date | null | undefined,
  now: Date = new Date(),
): UserPlan {
  if (plan === "plus" && planExpiresAt && now.getTime() >= planExpiresAt.getTime()) {
    return "free";
  }
  return plan;
}
