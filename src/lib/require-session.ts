import { redirect } from "next/navigation";
import type { Role, Session } from "@/domain/types";
import { loginPath, resolveRoleHomePath } from "@/lib/entry-route";
import { getServices } from "@/services";

/** Sync guard for pages that already loaded session (e.g. under `(app)` layout). */
export function requireRole(session: Session | null, role: Role, locale: string) {
  if (!session) redirect(loginPath(locale, { session: "expired" }));
  if (!session.activeGroupId) redirect(`/${locale}/groups`);
  if (session.user.role !== role) redirect(resolveRoleHomePath(locale, session));
}

export async function requireSession(locale: string): Promise<Session> {
  const session = await getServices().auth.getSession();
  if (!session) redirect(loginPath(locale, { session: "expired" }));
  return session;
}

export async function requireAppSession(locale: string): Promise<Session> {
  const session = await requireSession(locale);
  if (session.user.mustChangePassword) redirect(`/${locale}/change-password`);
  if (!session.activeGroupId) redirect(`/${locale}/groups`);
  return session;
}

export async function requireOperatorSession(locale: string): Promise<Session> {
  const session = await requireAppSession(locale);
  if (session.user.role !== "operator") redirect(resolveRoleHomePath(locale, session));
  return session;
}
