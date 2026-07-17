"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOperatorSession, requireSession } from "@/lib/require-session";
import { getServices } from "@/services";
import type { CreateTeammateResult } from "@/services/contracts";

const createTeammateSchema = z.object({
  email: z.string().trim().email().max(254),
});

export async function createTeammateForm(locale: string, formData: FormData) {
  const parsed = createTeammateSchema.safeParse({
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
  if (result.kind === "invitation") {
    redirect(`/${locale}/teammates?invited=1`);
  }
  redirect(`/${locale}/teammates/${result.teammate.id}`);
}

export async function updateTeammateForm(
  locale: string,
  teammateId: string,
  formData: FormData,
) {
  const displayNameRaw = String(formData.get("displayName") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const displayName = displayNameRaw.trim() || null;

  const session = await requireOperatorSession(locale);
  const { teammates } = getServices();

  try {
    await teammates.updateTeammate(
      teammateId,
      {
        displayName,
        ...(email ? { email } : {}),
      },
      { session },
    );
  } catch {
    redirect(`/${locale}/teammates/${teammateId}?error=edit`);
  }

  revalidatePath(`/${locale}/teammates/${teammateId}`);
  revalidatePath(`/${locale}/teammates`);
  redirect(`/${locale}/teammates/${teammateId}`);
}

export async function updateOwnDisplayNameForm(locale: string, formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim() || null;
  const session = await requireSession(locale);
  if (!session.activeGroupId) {
    redirect(`/${locale}/groups`);
  }
  const { teammates } = getServices();
  try {
    await teammates.updateMembershipDisplayName(session.user.id, displayName, {
      session,
    });
  } catch {
    redirect(`/${locale}/profile?displayNameError=1`);
  }
  revalidatePath(`/${locale}/profile`);
  revalidatePath(`/${locale}/teammates`);
  revalidatePath(`/${locale}/tasks`);
  redirect(`/${locale}/profile?displayNameSaved=1`);
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
