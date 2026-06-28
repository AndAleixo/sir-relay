"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Session } from "@/domain/types";
import { mockAuthService } from "@/services/mock/auth.mock";

export async function switchMockRole(
  locale: string,
  role: "operator" | "teammate",
) {
  await mockAuthService.setMockRole(role);
  revalidatePath("/", "layout");
  redirect(`/${locale}/tasks`);
}

export async function mockLogin(locale: string, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  let session: Session;
  try {
    session = await mockAuthService.login(email, password);
  } catch {
    redirect(`/${locale}/admin?error=invalid`);
  }

  revalidatePath("/", "layout");
  redirect(
    session.user.role === "operator"
      ? `/${locale}/teammates`
      : `/${locale}/tasks`,
  );
}

export async function mockLogout(locale: string) {
  await mockAuthService.logout();
  revalidatePath("/", "layout");
  redirect(`/${locale}/admin`);
}
