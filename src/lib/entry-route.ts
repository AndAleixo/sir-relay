import type { Session } from "@/domain/types";

/**
 * Post-auth entry route (Model A).
 * Logged out → admin · must change password → change-password · operator → teammates · teammate → tasks
 */
export function resolveEntryPath(locale: string, session: Session | null): string {
  if (!session) return `/${locale}/admin`;
  if (session.user.mustChangePassword) return `/${locale}/change-password`;
  if (session.user.role === "operator") return `/${locale}/teammates`;
  return `/${locale}/tasks`;
}

/** Wrong-role guard fallback — always lands on the role home, not a generic /tasks. */
export function resolveRoleHomePath(locale: string, session: Session): string {
  if (session.user.mustChangePassword) return `/${locale}/change-password`;
  if (session.user.role === "operator") return `/${locale}/teammates`;
  return `/${locale}/tasks`;
}
