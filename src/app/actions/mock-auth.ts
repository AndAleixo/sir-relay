"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mockAuthService } from "@/services/mock/auth.mock";

export async function switchMockRole(
  locale: string,
  role: "operator" | "teammate",
) {
  mockAuthService.setMockRole(role);
  revalidatePath("/", "layout");
  redirect(`/${locale}/tasks`);
}

export async function mockLogin(locale: string, as: "operator" | "teammate") {
  const email = as === "operator" ? "alex@example.com" : "ana@example.com";
  await mockAuthService.login(email, "mock");
  redirect(`/${locale}/tasks`);
}

export async function mockLogout(locale: string) {
  await mockAuthService.logout();
  redirect(`/${locale}/login`);
}
