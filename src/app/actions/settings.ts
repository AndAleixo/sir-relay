"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/domain/types";
import { requireAppSession } from "@/lib/require-session";
import { getServices } from "@/services";
import { locales } from "@/i18n/config";

export async function updateUserLocale(newLocale: string, pathname: string) {
  if (!locales.includes(newLocale as Locale)) {
    return;
  }

  const { auth, users } = getServices();
  const session = await auth.getSession();
  if (!session) return;

  const user = await users.updateLocale(session.user.id, newLocale as Locale, {
    session,
  });
  await auth.refreshSessionUser(user);
  revalidatePath("/", "layout");

  const segments = pathname.split("/");
  segments[1] = newLocale;
  redirect(segments.join("/") || `/${newLocale}/profile`);
}

export async function renameGroupForm(locale: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const groupId = String(formData.get("groupId") ?? "").trim();

  if (name.length < 2) {
    redirect(`/${locale}/settings?renameError=short`);
  }

  const session = await requireAppSession(locale);
  if (session.user.role !== "operator") {
    redirect(`/${locale}/settings`);
  }

  const { groups } = getServices();
  try {
    await groups.renameGroup(session.user.id, groupId, name);
  } catch {
    redirect(`/${locale}/settings?renameError=failed`);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/settings?renamed=1`);
}

function projectErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "Invalid acronym") return "acronym";
  if (message === "Invalid name") return "name";
  if (message === "Taken") return "taken";
  if (message === "Limit") return "limit";
  if (message === "PendingLimit") return "pendingLimit";
  return "failed";
}

export async function createProjectForm(locale: string, formData: FormData) {
  const session = await requireAppSession(locale);
  if (session.user.role !== "operator") {
    redirect(`/${locale}/settings`);
  }

  const { projects } = getServices();
  try {
    await projects.create(
      {
        name: String(formData.get("name") ?? ""),
        acronym: String(formData.get("acronym") ?? ""),
      },
      { session },
    );
  } catch (error) {
    redirect(`/${locale}/settings?projectError=${projectErrorCode(error)}`);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/settings?projectSaved=1`);
}

export async function requestProjectForm(locale: string, formData: FormData) {
  const session = await requireAppSession(locale);
  if (session.user.role !== "teammate") {
    redirect(`/${locale}/settings`);
  }

  const { projects } = getServices();
  try {
    await projects.request(
      {
        name: String(formData.get("name") ?? ""),
        acronym: String(formData.get("acronym") ?? ""),
      },
      { session },
    );
  } catch (error) {
    redirect(`/${locale}/settings?projectError=${projectErrorCode(error)}`);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/settings?projectRequested=1`);
}

export async function acceptProjectForm(locale: string, formData: FormData) {
  const session = await requireAppSession(locale);
  if (session.user.role !== "operator") {
    redirect(`/${locale}/settings`);
  }

  const id = String(formData.get("projectId") ?? "").trim();
  if (!id) redirect(`/${locale}/settings?projectError=failed`);

  const { projects } = getServices();
  try {
    await projects.accept(id, { session });
  } catch (error) {
    redirect(`/${locale}/settings?projectError=${projectErrorCode(error)}`);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/settings?projectAccepted=1`);
}

export async function archiveProjectForm(locale: string, formData: FormData) {
  const session = await requireAppSession(locale);
  if (session.user.role !== "operator") {
    redirect(`/${locale}/settings`);
  }

  const id = String(formData.get("projectId") ?? "").trim();
  if (!id) redirect(`/${locale}/settings?projectError=failed`);

  const { projects } = getServices();
  try {
    await projects.archive(id, { session });
  } catch {
    redirect(`/${locale}/settings?projectError=failed`);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/settings?projectRemoved=1`);
}
