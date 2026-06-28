import type { Session } from "@/domain/types";

/** Model A: sign-in portal when logged out; app when logged in. */
export function resolveEntryPath(locale: string, session: Session | null): string {
  if (!session) return `/${locale}/admin`;
  return `/${locale}/tasks`;
}
