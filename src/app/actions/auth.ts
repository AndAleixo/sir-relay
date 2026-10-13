"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/domain/types";
import { loginPath, resolveEntryPath } from "@/lib/entry-route";
import { checkPasswordPolicy } from "@/lib/password-policy";
import { locales, defaultLocale } from "@/i18n/config";
import { getServices } from "@/services";

export async function loginForm(locale: string, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  let session;
  try {
    session = await getServices().auth.login(email, password);
  } catch (err) {
    if (err instanceof Error && err.message === "Email unverified") {
      redirect(loginPath(locale, { error: "unverified" }));
    }
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
  const acceptLegal = formData.get("acceptLegal") === "1";

  if (!acceptLegal) {
    redirect(`/${locale}/signup?error=legal`);
  }
  if (checkPasswordPolicy(newPassword)) {
    redirect(`/${locale}/signup?error=weak`);
  }
  if (newPassword !== confirmPassword) {
    redirect(`/${locale}/signup?error=mismatch`);
  }

  let result;
  try {
    const signupLocale = locales.includes(locale as Locale)
      ? (locale as Locale)
      : defaultLocale;
    result = await getServices().auth.signup(
      name,
      email,
      newPassword,
      signupLocale,
    );
  } catch (err) {
    if (err instanceof Error && err.message === "Weak password") {
      redirect(`/${locale}/signup?error=weak`);
    }
    redirect(`/${locale}/signup?error=taken`);
  }
  if (result.kind === "pending_verification") {
    redirect(`/${locale}/check-email`);
  }
  revalidatePath("/", "layout");
  redirect(resolveEntryPath(locale, result.session));
}

export async function forgotPasswordForm(locale: string, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const signupLocale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;
  try {
    await getServices().auth.requestPasswordReset(email, signupLocale);
  } catch {
    /* always generic */
  }
  redirect(`/${locale}/forgot-password?sent=1`);
}

export async function resetPasswordForm(locale: string, formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (checkPasswordPolicy(newPassword)) {
    redirect(`/${locale}/reset-password?token=${encodeURIComponent(token)}&error=weak`);
  }
  if (newPassword !== confirmPassword) {
    redirect(
      `/${locale}/reset-password?token=${encodeURIComponent(token)}&error=mismatch`,
    );
  }

  try {
    await getServices().auth.resetPasswordWithToken(token, newPassword);
  } catch (err) {
    if (err instanceof Error && err.message === "Weak password") {
      redirect(`/${locale}/reset-password?token=${encodeURIComponent(token)}&error=weak`);
    }
    redirect(`/${locale}/reset-password?error=invalid`);
  }
  redirect(loginPath(locale, { reset: "1" }));
}

export async function resendVerificationForm(locale: string, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const signupLocale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;
  try {
    await getServices().auth.resendVerificationEmail(email, signupLocale);
  } catch {
    /* generic */
  }
  redirect(`/${locale}/check-email?resent=1`);
}

export async function logoutAction(locale: string) {
  await getServices().auth.logout();
  revalidatePath("/", "layout");
  redirect(`/${locale}`);
}

export async function acceptLegalForm(locale: string, formData: FormData) {
  const acceptLegal = formData.get("acceptLegal") === "1";
  if (!acceptLegal) {
    redirect(`/${locale}/accept-terms`);
  }

  const { auth } = getServices();
  const session = await auth.getSession();
  if (!session) {
    redirect(loginPath(locale, { session: "expired" }));
  }

  const next = await auth.acceptLegalTerms(session.user.id);
  revalidatePath("/", "layout");
  redirect(resolveEntryPath(locale, next));
}

export async function changePasswordForm(locale: string, formData: FormData) {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (checkPasswordPolicy(newPassword)) {
    redirect(`/${locale}/change-password?error=weak`);
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
  } catch (err) {
    if (err instanceof Error && err.message === "Weak password") {
      redirect(`/${locale}/change-password?error=weak`);
    }
    redirect(`/${locale}/change-password?error=invalid`);
  }

  revalidatePath("/", "layout");
  const next = await auth.getSession();
  redirect(resolveEntryPath(locale, next));
}

export async function joinAccountForm(locale: string, token: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (name.length < 2) {
    redirect(`/${locale}/join/${token}?error=name`);
  }
  if (checkPasswordPolicy(newPassword)) {
    redirect(`/${locale}/join/${token}?error=weak`);
  }
  if (newPassword !== confirmPassword) {
    redirect(`/${locale}/join/${token}?error=mismatch`);
  }

  let session;
  try {
    const joinLocale = locales.includes(locale as Locale)
      ? (locale as Locale)
      : defaultLocale;
    session = await getServices().auth.joinWithToken(
      token,
      newPassword,
      joinLocale,
      name,
    );
  } catch (err) {
    if (err instanceof Error && err.message === "Weak password") {
      redirect(`/${locale}/join/${token}?error=weak`);
    }
    redirect(`/${locale}/join/${token}?error=invalid`);
  }
  revalidatePath("/", "layout");
  redirect(resolveEntryPath(locale, session));
}

export async function profileChangePasswordForm(locale: string, formData: FormData) {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (checkPasswordPolicy(newPassword)) {
    redirect(`/${locale}/profile?passwordError=weak`);
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
  } catch (err) {
    if (err instanceof Error && err.message === "Weak password") {
      redirect(`/${locale}/profile?passwordError=weak`);
    }
    redirect(`/${locale}/profile?passwordError=invalid`);
  }

  revalidatePath(`/${locale}/profile`);
  redirect(`/${locale}/profile?passwordChanged=1`);
}

export async function deleteAccountForm(locale: string, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!password) {
    redirect(`/${locale}/profile/delete?error=invalid`);
  }

  const { auth } = getServices();
  const session = await auth.getSession();
  if (!session) {
    redirect(loginPath(locale, { session: "expired" }));
  }

  try {
    await auth.deleteAccount(session.user.id, password);
  } catch (err) {
    if (err instanceof Error && err.message === "Invalid password") {
      redirect(`/${locale}/profile/delete?error=invalid`);
    }
    redirect(`/${locale}/profile/delete?error=failed`);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}`);
}

export async function profileUpdateNameForm(locale: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2) {
    redirect(`/${locale}/profile?nameError=short`);
  }

  const { auth, users } = getServices();
  const session = await auth.getSession();
  if (!session) {
    redirect(loginPath(locale, { session: "expired" }));
  }

  const user = await users.updateName(session.user.id, name, { session });
  await auth.refreshSessionUser(user);
  revalidatePath("/", "layout");
  redirect(`/${locale}/profile?nameSaved=1`);
}

export async function regenerateTelegramLinkAction(locale: string) {
  const { auth, users } = getServices();
  const session = await auth.getSession();
  if (!session) {
    redirect(loginPath(locale, { session: "expired" }));
  }

  await users.regenerateTelegramLink(session.user.id, { session });
  revalidatePath(`/${locale}/profile`);
  redirect(`/${locale}/profile`);
}
