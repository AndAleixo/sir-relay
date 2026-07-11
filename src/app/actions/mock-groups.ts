"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseInviteToken } from "@/lib/invite-token";
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

/** Paste invite link or code from the groups hub. */
export async function mockRedeemInviteLink(locale: string, formData: FormData) {
  const raw = String(formData.get("invite") ?? "").trim();
  const token = parseInviteToken(raw);
  if (!token) {
    redirect(`/${locale}/groups?error=invite_invalid`);
  }

  const session = await requireSession(locale);
  const { groups, auth } = getServices();
  const preview = await groups.previewInvite(token);
  if (!preview) {
    redirect(`/${locale}/groups?error=invite_invalid`);
  }

  if (session.user.email.toLowerCase() !== preview.email.toLowerCase()) {
    redirect(`/${locale}/join/${token}?error=email_mismatch`);
  }

  if (preview.needsPassword) {
    redirect(`/${locale}/join/${token}`);
  }

  try {
    const group = await groups.acceptInvite(session.user.id, token);
    const next = await auth.setActiveGroup(session.user.id, group.id);
    revalidatePath("/", "layout");
    redirect(resolveEntryPath(locale, next));
  } catch {
    redirect(`/${locale}/groups?error=invite_invalid`);
  }
}

/** Logged-in user accepts invite (account already active). */
export async function mockAcceptInvite(locale: string, token: string) {
  const session = await requireSession(locale);
  const { groups, auth } = getServices();

  try {
    const group = await groups.acceptInvite(session.user.id, token);
    const next = await auth.setActiveGroup(session.user.id, group.id);
    revalidatePath("/", "layout");
    redirect(resolveEntryPath(locale, next));
  } catch {
    redirect(`/${locale}/join/${token}?error=invalid`);
  }
}
