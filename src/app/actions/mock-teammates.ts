"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/domain/types";
import { locales } from "@/i18n/config";
import { getServices } from "@/services";

function parseLocale(value: FormDataEntryValue | null): Locale {
  const locale = String(value ?? "en");
  return locales.includes(locale as Locale) ? (locale as Locale) : "en";
}

export async function mockCreateTeammate(locale: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const teammateLocale = parseLocale(formData.get("locale"));

  if (!name || !email) {
    redirect(`/${locale}/teammates/new`);
  }

  const { teammates } = getServices();
  const teammate = await teammates.createTeammate({
    name,
    email,
    locale: teammateLocale,
  });

  revalidatePath(`/${locale}/teammates`);
  redirect(`/${locale}/teammates/${teammate.id}`);
}

export async function mockUpdateTeammate(
  locale: string,
  teammateId: string,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  const { auth, teammates } = getServices();
  const session = await auth.getSession();
  if (!session || session.user.role !== "operator") {
    redirect(`/${locale}/teammates`);
  }

  try {
    await teammates.updateTeammate(teammateId, {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
    });
  } catch {
    redirect(`/${locale}/teammates/${teammateId}?error=edit`);
  }

  revalidatePath(`/${locale}/teammates/${teammateId}`);
  redirect(`/${locale}/teammates/${teammateId}`);
}

export async function mockDeactivateTeammate(locale: string, teammateId: string) {
  const { auth, teammates } = getServices();
  const session = await auth.getSession();
  if (!session || session.user.role !== "operator") {
    redirect(`/${locale}/teammates`);
  }

  await teammates.deactivateTeammate(teammateId);
  revalidatePath(`/${locale}/teammates`);
  redirect(`/${locale}/teammates`);
}

export async function mockRegenerateInvite(locale: string, teammateId: string) {
  const { auth, teammates } = getServices();
  const session = await auth.getSession();
  if (!session || session.user.role !== "operator") {
    redirect(`/${locale}/teammates`);
  }

  await teammates.regenerateInvite(teammateId);
  revalidatePath(`/${locale}/teammates/${teammateId}`);
  redirect(`/${locale}/teammates/${teammateId}`);
}

export async function mockRegenerateTeammateTelegramLink(
  locale: string,
  teammateId: string,
) {
  const { auth, teammates } = getServices();
  const session = await auth.getSession();
  if (!session || session.user.role !== "operator") {
    redirect(`/${locale}/teammates`);
  }

  await teammates.regenerateTelegramLink(teammateId);
  revalidatePath(`/${locale}/teammates/${teammateId}`);
  redirect(`/${locale}/teammates/${teammateId}`);
}
