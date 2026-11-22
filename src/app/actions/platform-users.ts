"use server";

import { revalidatePath } from "next/cache";
import { isUserPlan } from "@/lib/ai-suggest-quota";
import { setUserPlan } from "@/lib/ai-suggest-quota-store";
import { requirePlatformAdminSession } from "@/lib/require-session";

export async function updatePlatformUserPlanAction(
  locale: string,
  formData: FormData,
): Promise<void> {
  await requirePlatformAdminSession(locale);
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

  await setUserPlan(userId, { plan: planRaw, planExpiresAt });
  revalidatePath(`/${locale}/platform/users`);
}
