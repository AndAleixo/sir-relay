"use server";

import { redirect } from "next/navigation";
import {
  platformAdminConfigured,
  verifyPlatformCredentials,
  writePlatformSession,
} from "@/lib/platform-session";

// CSRF: same-origin Origin/Referer check in middleware (csrf-origin.ts) covers POSTs here.
// Rate limit: /platform/login is in isAuthRateLimitedPath (10/min/IP).

export type PlatformLoginState = { error: string | null };

export async function platformLoginAction(
  locale: string,
  _prev: PlatformLoginState,
  formData: FormData,
): Promise<PlatformLoginState> {
  if (!platformAdminConfigured()) {
    return { error: "not_configured" };
  }
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!verifyPlatformCredentials(username, password)) {
    return { error: "invalid" };
  }
  await writePlatformSession({ username: username.trim() });
  redirect(`/${locale}/platform`);
}

export async function platformLogoutAction(locale: string): Promise<void> {
  await writePlatformSession(null);
  redirect(`/${locale}/platform/login`);
}
