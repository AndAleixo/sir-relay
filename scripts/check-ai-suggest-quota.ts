/**
 * Self-check: AI suggest plan period roll + monthly limits.
 * Run: npx tsx scripts/check-ai-suggest-quota.ts
 */
import assert from "node:assert/strict";
import {
  AI_SUGGEST_MONTHLY_LIMIT,
  AI_SUGGEST_TASKS_MAX,
  AI_SUGGEST_TEXT_MAX,
  addUtcDays,
  addUtcMonth,
  effectivePlan,
  extendPlanExpiry,
  monthlyLimitFor,
  rollPlanPeriod,
} from "../src/lib/ai-suggest-quota";

assert.equal(AI_SUGGEST_TEXT_MAX, 300);
assert.equal(AI_SUGGEST_TASKS_MAX, 5);
assert.equal(monthlyLimitFor("basic"), 5);
assert.equal(monthlyLimitFor("plus"), 30);
assert.equal(AI_SUGGEST_MONTHLY_LIMIT.basic, 5);

const start = new Date(Date.UTC(2026, 0, 15, 12, 0, 0));
const mid = new Date(Date.UTC(2026, 0, 20, 12, 0, 0));
const nextMonth = new Date(Date.UTC(2026, 1, 15, 12, 0, 0));
const later = new Date(Date.UTC(2026, 3, 1, 0, 0, 0));

const same = rollPlanPeriod(start, 3, mid);
assert.equal(same.used, 3);
assert.equal(same.periodStart.getTime(), start.getTime());

const rolled = rollPlanPeriod(start, 3, nextMonth);
assert.equal(rolled.used, 0);
assert.equal(rolled.periodStart.getTime(), addUtcMonth(start).getTime());

const multi = rollPlanPeriod(start, 2, later);
assert.equal(multi.used, 0);
assert.ok(multi.periodStart.getTime() > start.getTime());
assert.ok(later.getTime() < addUtcMonth(multi.periodStart).getTime());

assert.equal(
  effectivePlan(
    "plus",
    new Date(Date.UTC(2020, 0, 1)),
    new Date(Date.UTC(2026, 0, 1)),
  ),
  "basic",
);
assert.equal(
  effectivePlan(
    "plus",
    new Date(Date.UTC(2030, 0, 1)),
    new Date(Date.UTC(2026, 0, 1)),
  ),
  "plus",
);

const now = new Date(Date.UTC(2026, 5, 1));
const futureEnd = new Date(Date.UTC(2026, 5, 15));
const fromFuture = extendPlanExpiry(futureEnd, 30, now);
assert.equal(fromFuture.getTime(), addUtcDays(futureEnd, 30).getTime());
const fromPast = extendPlanExpiry(new Date(Date.UTC(2026, 4, 1)), 30, now);
assert.equal(fromPast.getTime(), addUtcDays(now, 30).getTime());
const fromNull = extendPlanExpiry(null, 90, now);
assert.equal(fromNull.getTime(), addUtcDays(now, 90).getTime());

console.log("check-ai-suggest-quota: ok");
