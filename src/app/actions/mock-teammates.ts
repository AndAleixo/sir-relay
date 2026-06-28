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
