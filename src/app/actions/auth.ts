"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/domain/types";
import { loginPath, resolveEntryPath } from "@/lib/entry-route";
import { locales, defaultLocale } from "@/i18n/config";
import { getServices } from "@/services";

export async function loginForm(locale: string, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  let session;
  try {
    session = await getServices().auth.login(email, password);
  } catch {
    redirect(loginPath(locale, { error: "invalid" }));
  }
  revalidatePath("/", "layout");
  redirect(resolveEntryPath(locale, session));
}

export async function signupForm(locale: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    redirect(`/${locale}/signup?error=short`);
  }
  if (newPassword !== confirmPassword) {
    redirect(`/${locale}/signup?error=mismatch`);
  }

  let session;
  try {
    const signupLocale = locales.includes(locale as Locale)
      ? (locale as Locale)
      : defaultLocale;
    session = await getServices().auth.signup(
      name,
      email,
      newPassword,
      signupLocale,
    );
  } catch {
    redirect(`/${locale}/signup?error=taken`);
  }
  revalidatePath("/", "layout");
  redirect(resolveEntryPath(locale, session));
}

export async function logoutAction(locale: string) {
  await getServices().auth.logout();
  revalidatePath("/", "layout");
  redirect(`/${locale}`);
}

export async function changePasswordForm(locale: string, formData: FormData) {
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
    redirect(loginPath(locale, { session: "expired" }));
  }

  try {
    await auth.changePassword(session.user.id, currentPassword, newPassword);
  } catch {
    redirect(`/${locale}/change-password?error=invalid`);
  }

  revalidatePath("/", "layout");
  const next = await auth.getSession();
  redirect(resolveEntryPath(locale, next));
}

export async function joinAccountForm(locale: string, token: string, formData: FormData) {
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    redirect(`/${locale}/join/${token}?error=short`);
  }
  if (newPassword !== confirmPassword) {
    redirect(`/${locale}/join/${token}?error=mismatch`);
  }

  let session;
  try {
    session = await getServices().auth.joinWithToken(token, newPassword);
  } catch {
    redirect(`/${locale}/join/${token}?error=invalid`);
  }
  revalidatePath("/", "layout");
  redirect(resolveEntryPath(locale, session));
}

export async function profileChangePasswordForm(locale: string, formData: FormData) {
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
    redirect(loginPath(locale, { session: "expired" }));
  }

  try {
    await auth.changePassword(session.user.id, currentPassword, newPassword);
  } catch {
    redirect(`/${locale}/profile?passwordError=invalid`);
  }

  revalidatePath(`/${locale}/profile`);
  redirect(`/${locale}/profile?passwordChanged=1`);
}

export async function generateTelegramLinkAction(locale: string) {
  const { auth, users } = getServices();
  const session = await auth.getSession();
  if (!session) {
    redirect(loginPath(locale, { session: "expired" }));
  }

  await users.regenerateTelegramLink(session.user.id);
  revalidatePath(`/${locale}/profile`);
  redirect(`/${locale}/profile`);
}
