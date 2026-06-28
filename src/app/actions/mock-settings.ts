"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/domain/types";
import { getServices } from "@/services";
import { mockAuthService } from "@/services/mock/auth.mock";
import { locales } from "@/i18n/config";

export async function updateUserLocale(newLocale: string, pathname: string) {
  if (!locales.includes(newLocale as Locale)) {
    return;
  }

  const { auth, users } = getServices();
  const session = await auth.getSession();
  if (!session) return;

  const user = await users.updateLocale(session.user.id, newLocale as Locale);
  await mockAuthService.updateSessionUser(user);
  revalidatePath("/", "layout");

  const segments = pathname.split("/");
  segments[1] = newLocale;
  redirect(segments.join("/") || `/${newLocale}/settings`);
}
