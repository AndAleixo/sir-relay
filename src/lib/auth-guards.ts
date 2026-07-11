import { redirect } from "next/navigation";
import type { Role, Session } from "@/domain/types";
import { resolveRoleHomePath } from "@/lib/entry-route";

export function requireRole(session: Session | null, role: Role, locale: string) {
  if (!session) redirect(`/${locale}/admin?session=expired`);
  if (session.user.role !== role) redirect(resolveRoleHomePath(locale, session));
}
