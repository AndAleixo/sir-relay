"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOperatorSession } from "@/lib/require-session";
import { getServices } from "@/services";
import type { CreateTeammateResult } from "@/services/contracts";

const createTeammateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
});

export async function createTeammateForm(locale: string, formData: FormData) {
  const parsed = createTeammateSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.success) {
    redirect(`/${locale}/teammates/new?error=invalid`);
  }

  const session = await requireOperatorSession(locale);
  const { teammates } = getServices();

  let result: CreateTeammateResult;
  try {
    result = await teammates.createTeammate(parsed.data, { session });
  } catch {
    redirect(`/${locale}/teammates/new?error=create`);
  }
  if (!result.ok) {
    redirect(
      `/${locale}/teammates/new?error=${
        result.reason === "account_inactive" ? "inactive" : "exists"
      }`,
    );
  }

  revalidatePath(`/${locale}/teammates`);
  redirect(`/${locale}/teammates/${result.teammate.id}`);
}

export async function updateTeammateForm(
  locale: string,
  teammateId: string,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  const session = await requireOperatorSession(locale);
  const { teammates } = getServices();

  try {
    await teammates.updateTeammate(
      teammateId,
      {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
      },
      { session },
    );
  } catch {
    redirect(`/${locale}/teammates/${teammateId}?error=edit`);
  }

  revalidatePath(`/${locale}/teammates/${teammateId}`);
  redirect(`/${locale}/teammates/${teammateId}`);
}

export async function removeTeammate(locale: string, teammateId: string) {
  const session = await requireOperatorSession(locale);
  const { teammates } = getServices();

  try {
    await teammates.removeTeammate(teammateId, { session });
  } catch {
    redirect(`/${locale}/teammates/${teammateId}?error=remove`);
  }
  revalidatePath(`/${locale}/teammates`);
  redirect(`/${locale}/teammates`);
}

export async function promoteTeammate(locale: string, teammateId: string) {
  const session = await requireOperatorSession(locale);
  const { teammates } = getServices();

  try {
    await teammates.promoteToOperator(teammateId, { session });
  } catch {
    redirect(`/${locale}/teammates/${teammateId}?error=promote`);
  }

  revalidatePath(`/${locale}/teammates`);
  revalidatePath("/", "layout");
  redirect(`/${locale}/teammates?promoted=1`);
}

export async function regenerateInviteForm(locale: string, teammateId: string) {
  const session = await requireOperatorSession(locale);
  const { teammates } = getServices();

  try {
    await teammates.regenerateInvite(teammateId, { session });
  } catch {
    redirect(`/${locale}/teammates/${teammateId}?error=invite`);
  }
  revalidatePath(`/${locale}/teammates/${teammateId}`);
  redirect(`/${locale}/teammates/${teammateId}`);
}
