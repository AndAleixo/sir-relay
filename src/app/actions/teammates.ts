"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOperatorSession } from "@/lib/require-session";
import { getServices } from "@/services";

export async function createTeammateForm(locale: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!name || !email) {
    redirect(`/${locale}/teammates/new`);
  }

  const session = await requireOperatorSession(locale);
  const { teammates } = getServices();
  const teammate = await teammates.createTeammate({ name, email }, { session });

  revalidatePath(`/${locale}/teammates`);
  redirect(`/${locale}/teammates/${teammate.id}`);
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

export async function deactivateTeammate(locale: string, teammateId: string) {
  const session = await requireOperatorSession(locale);
  const { teammates } = getServices();

  await teammates.deactivateTeammate(teammateId, { session });
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

  await teammates.regenerateInvite(teammateId, { session });
  revalidatePath(`/${locale}/teammates/${teammateId}`);
  redirect(`/${locale}/teammates/${teammateId}`);
}
