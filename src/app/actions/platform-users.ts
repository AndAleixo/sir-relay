"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/lib/audit";
import { isUserPlan } from "@/lib/ai-suggest-quota";
import {
  setUserPlan,
  type PlanMutationResult,
} from "@/lib/ai-suggest-quota-store";
import { requirePlatformAdminSession } from "@/lib/require-session";

function auditPlanChange(
  admin: string,
  userId: string,
  result: PlanMutationResult,
): void {
  void writeAudit({
    action: "plan_change",
    actorType: "system",
    actorId: null,
    metadata: {
      userId,
      admin,
      op: "set",
      fromPlan: result.before.plan,
      toPlan: result.after.plan,
      fromExpiresAt: result.before.planExpiresAt?.toISOString() ?? null,
      toExpiresAt: result.after.planExpiresAt?.toISOString() ?? null,
      usageReset: result.usageReset,
    },
  });
}

/** Absolute set: basic or plus with an end date. */
export async function updatePlatformUserPlanAction(
  locale: string,
  formData: FormData,
): Promise<void> {
  const session = await requirePlatformAdminSession(locale);
  const userId = String(formData.get("userId") ?? "").trim();
  const planRaw = String(formData.get("plan") ?? "").trim();
  if (!userId || !isUserPlan(planRaw)) return;

  let planExpiresAt: Date | null = null;
  if (planRaw === "plus") {
    const raw = String(formData.get("planExpiresAt") ?? "").trim();
    if (!raw) return;
    const parsed = new Date(`${raw}T23:59:59.999Z`);
    if (Number.isNaN(parsed.getTime())) return;
    planExpiresAt = parsed;
  }

  const result = await setUserPlan(userId, { plan: planRaw, planExpiresAt });
  if (result) auditPlanChange(session.username, userId, result);
  revalidatePath(`/${locale}/platform/users`);
}
