"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseInviteToken } from "@/lib/invite-token";
import { resolveEntryPath } from "@/lib/entry-route";
import { requireSession } from "@/lib/require-session";
import { getServices } from "@/services";

export type GroupFormState = { error: string | null };

async function activateGroupAndRedirect(
  locale: string,
  userId: string,
  groupId: string,
): Promise<never> {
  const { auth } = getServices();
  const next = await auth.setActiveGroup(userId, groupId);
  revalidatePath("/", "layout");
  redirect(resolveEntryPath(locale, next));
}

async function acceptInviteAndActivate(
  locale: string,
  userId: string,
  token: string,
): Promise<GroupFormState> {
  const { groups } = getServices();
  try {
    const group = await groups.acceptInvite(userId, token);
    return activateGroupAndRedirect(locale, userId, group.id);
  } catch {
    return { error: "invite_invalid" };
  }
}

export async function selectGroup(
  locale: string,
  groupId: string,
  returnPath: string,
) {
  const session = await requireSession(locale);
  const { groups } = getServices();

  if (!(await groups.isMember(session.user.id, groupId))) {
    redirect(returnPath.split("?")[0]);
  }

  await activateGroupAndRedirect(locale, session.user.id, groupId);
}

export async function createGroupForm(
  locale: string,
  _prev: GroupFormState | undefined,
  formData: FormData,
): Promise<GroupFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { error: "short" };
  }

  const session = await requireSession(locale);
  const { groups } = getServices();
  const group = await groups.create(session.user.id, name);
  return activateGroupAndRedirect(locale, session.user.id, group.id);
}

export async function redeemInviteForm(
  locale: string,
  _prev: GroupFormState | undefined,
  formData: FormData,
): Promise<GroupFormState> {
  const raw = String(formData.get("invite") ?? "").trim();
  const token = parseInviteToken(raw);
  if (!token) {
    return { error: "invite_invalid" };
  }

  const session = await requireSession(locale);
  const { groups } = getServices();
  const preview = await groups.previewInvite(token);
  if (!preview) {
    return { error: "invite_invalid" };
  }

  if (session.user.email.toLowerCase() !== preview.email.toLowerCase()) {
    return { error: "email_mismatch" };
  }

  if (preview.needsPassword) {
    redirect(`/${locale}/join/${token}`);
  }

  return acceptInviteAndActivate(locale, session.user.id, token);
}

async function redirectAfterMembershipChange(
  locale: string,
  userId: string,
  affectedGroupId: string,
): Promise<never> {
  const { auth, groups } = getServices();
  const session = await auth.getSession();
  const remaining = await groups.listForUser(userId);

  let activeGroupId: string | null;
  if (
    session?.activeGroupId &&
    session.activeGroupId !== affectedGroupId &&
    remaining.some((group) => group.id === session.activeGroupId)
  ) {
    activeGroupId = session.activeGroupId;
  } else if (remaining.length === 1) {
    activeGroupId = remaining[0].id;
  } else {
    activeGroupId = await groups.pickResumeGroupId(userId);
  }

  const next = await auth.setActiveGroup(userId, activeGroupId);
  revalidatePath("/", "layout");
  redirect(resolveEntryPath(locale, next));
}

function groupActionError(error: unknown): GroupFormState {
  if (error instanceof Error) {
    if (error.message === "last_operator") return { error: "last_operator" };
    if (error.message === "forbidden") return { error: "forbidden" };
    if (error.message === "not_member") return { error: "not_member" };
  }
  return { error: "action_failed" };
}

export async function leaveGroupForm(
  locale: string,
  _prev: GroupFormState | undefined,
  formData: FormData,
): Promise<GroupFormState> {
  const groupId = String(formData.get("groupId") ?? "").trim();
  if (!groupId) return { error: "action_failed" };

  const session = await requireSession(locale);
  const { groups } = getServices();
  if (!(await groups.isMember(session.user.id, groupId))) {
    return { error: "not_member" };
  }

  try {
    await groups.leaveGroup(session.user.id, groupId);
  } catch (error) {
    return groupActionError(error);
  }

  return redirectAfterMembershipChange(locale, session.user.id, groupId);
}

export async function deleteGroupForm(
  locale: string,
  _prev: GroupFormState | undefined,
  formData: FormData,
): Promise<GroupFormState> {
  const groupId = String(formData.get("groupId") ?? "").trim();
  if (!groupId) return { error: "action_failed" };

  const session = await requireSession(locale);
  const { groups } = getServices();
  if ((await groups.roleInGroup(session.user.id, groupId)) !== "operator") {
    return { error: "forbidden" };
  }

  try {
    await groups.deleteGroup(session.user.id, groupId);
  } catch (error) {
    return groupActionError(error);
  }

  return redirectAfterMembershipChange(locale, session.user.id, groupId);
}

/** Logged-in user accepts invite from `/join/[token]`. */
export async function acceptInvite(locale: string, token: string) {
  const session = await requireSession(locale);
  const result = await acceptInviteAndActivate(locale, session.user.id, token);
  if (result.error) {
    redirect(`/${locale}/join/${token}?error=invalid`);
  }
}
