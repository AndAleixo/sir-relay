"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveEntryPath } from "@/lib/entry-route";
import { getServices } from "@/services";

export async function mockLogin(locale: string, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    const session = await getServices().auth.login(email, password);
    revalidatePath("/", "layout");
    redirect(resolveEntryPath(locale, session));
  } catch {
    redirect(`/${locale}/admin?error=invalid`);
  }
}

export async function mockLogout(locale: string) {
  await getServices().auth.logout();
  revalidatePath("/", "layout");
  redirect(`/${locale}/admin`);
}

export async function mockChangePassword(locale: string, formData: FormData) {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    redirect(`/${locale}/change-password?error=short`);
  }
  if (newPassword !== confirmPassword) {
    redirect(`/${locale}/change-password?error=mismatch`);
  }

  const { auth } = getServices();
  const session = await auth.getSession();
  if (!session) {
    redirect(`/${locale}/admin?session=expired`);
  }

  try {
    await auth.changePassword(session.user.id, currentPassword, newPassword);
  } catch {
    redirect(`/${locale}/change-password?error=invalid`);
  }

  revalidatePath("/", "layout");
  redirect(
    resolveEntryPath(locale, {
      user: { ...session.user, mustChangePassword: false },
    }),
  );
}

export async function mockJoinAccount(locale: string, token: string, formData: FormData) {
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    redirect(`/${locale}/join/${token}?error=short`);
  }
  if (newPassword !== confirmPassword) {
    redirect(`/${locale}/join/${token}?error=mismatch`);
  }

  try {
    const session = await getServices().auth.joinWithToken(token, newPassword);
    revalidatePath("/", "layout");
    redirect(resolveEntryPath(locale, session));
  } catch {
    redirect(`/${locale}/join/${token}?error=invalid`);
  }
}

export async function mockProfileChangePassword(locale: string, formData: FormData) {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    redirect(`/${locale}/profile?passwordError=short`);
  }
  if (newPassword !== confirmPassword) {
    redirect(`/${locale}/profile?passwordError=mismatch`);
  }

  const { auth } = getServices();
  const session = await auth.getSession();
  if (!session) {
    redirect(`/${locale}/admin?session=expired`);
  }

  try {
    await auth.changePassword(session.user.id, currentPassword, newPassword);
  } catch {
    redirect(`/${locale}/profile?passwordError=invalid`);
  }

  revalidatePath(`/${locale}/profile`);
  redirect(`/${locale}/profile?passwordChanged=1`);
}

export async function mockGenerateTelegramLink(locale: string) {
  const { auth, users } = getServices();
  const session = await auth.getSession();
  if (!session) {
    redirect(`/${locale}/admin?session=expired`);
  }

  await users.regenerateTelegramLink(session.user.id);
  revalidatePath(`/${locale}/profile`);
  redirect(`/${locale}/profile`);
}
