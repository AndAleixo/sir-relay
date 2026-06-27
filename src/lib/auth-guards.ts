import { redirect } from "next/navigation";
import type { Role, Session } from "@/domain/types";

export function requireRole(session: Session | null, role: Role, locale: string) {
  if (!session) redirect(`/${locale}/login`);
  if (session.user.role !== role) redirect(`/${locale}/tasks`);
}
