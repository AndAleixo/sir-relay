"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveEntryPath } from "@/lib/entry-route";
import { requireOperatorSession, requireSession } from "@/lib/require-session";
import { getServices } from "@/services";

export type InvitationActionState = { error: string | null };

export async function acceptGroupInvitation(
  locale: string,
  invitationId: string,
  _previous: InvitationActionState,
): Promise<InvitationActionState> {
  const session = await requireSession(locale);
  const { auth, invitations } = getServices();
  let group;
  try {
    group = await invitations.accept(invitationId, session.user.id);
  } catch {
    return { error: "invitation_invalid" };
  }

  const next = await auth.setActiveGroup(session.user.id, group.id);
  revalidatePath("/", "layout");
  redirect(resolveEntryPath(locale, next));
}

export async function declineGroupInvitation(
  locale: string,
  invitationId: string,
  _previous: InvitationActionState,
): Promise<InvitationActionState> {
  const session = await requireSession(locale);
  const { invitations } = getServices();
  try {
    await invitations.decline(invitationId, session.user.id);
  } catch {
    return { error: "invitation_invalid" };
  }
  revalidatePath("/", "layout");
  return { error: null };
}

export async function resendGroupInvitation(locale: string, invitationId: string) {
  const session = await requireOperatorSession(locale);
  const { invitations } = getServices();
  try {
    await invitations.resend(invitationId, { session });
  } catch {
    redirect(`/${locale}/teammates?invitationError=1`);
  }
  revalidatePath(`/${locale}/teammates`);
  redirect(`/${locale}/teammates?resent=1`);
}
