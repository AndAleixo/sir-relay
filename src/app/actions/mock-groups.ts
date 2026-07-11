"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveEntryPath } from "@/lib/entry-route";
import { requireSession } from "@/lib/require-session";
import { getServices } from "@/services";

export async function mockSelectGroup(locale: string, groupId: string) {
  const session = await requireSession(locale);
  const { auth, groups } = getServices();

  const allowed = (await groups.listForUser(session.user.id)).some(
    (g) => g.id === groupId,
  );
  if (!allowed) {
    redirect(`/${locale}/groups?error=invalid`);
  }

  const next = await auth.setActiveGroup(session.user.id, groupId);
  revalidatePath("/", "layout");
  redirect(resolveEntryPath(locale, next));
}

export async function mockCreateGroup(locale: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    redirect(`/${locale}/groups/new?error=short`);
  }

  const session = await requireSession(locale);
  const { auth, groups } = getServices();

  const group = await groups.create(session.user.id, name);
  const next = await auth.setActiveGroup(session.user.id, group.id);
  revalidatePath("/", "layout");
  redirect(resolveEntryPath(locale, next));
}

/** Clear active group so the hub can pick another. */
export async function mockOpenGroupsHub(locale: string) {
  const session = await requireSession(locale);
  const { auth } = getServices();

  await auth.setActiveGroup(session.user.id, null);
  revalidatePath("/", "layout");
  redirect(`/${locale}/groups`);
}
