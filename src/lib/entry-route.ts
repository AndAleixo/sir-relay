import type { Session } from "@/domain/types";

function roleHomePath(locale: string, session: Session): string {
  if (session.user.mustChangePassword) return `/${locale}/change-password`;
  if (session.user.needsLegalAccept) return `/${locale}/accept-terms`;
  if (!session.activeGroupId) return `/${locale}/groups`;
  if (session.user.role === "operator") return `/${locale}/teammates`;
  return `/${locale}/tasks`;
}

/**
 * Post-auth routing.
 * Logged out → landing · password → legal → no group → groups · else role home.
 */
export function resolveEntryPath(locale: string, session: Session | null): string {
  if (!session) return `/${locale}`;
  return roleHomePath(locale, session);
}

export function resolveRoleHomePath(locale: string, session: Session): string {
  return roleHomePath(locale, session);
}

export const LOGIN_PATH = "login";

export function loginPath(locale: string, query?: Record<string, string>): string {
  const base = `/${locale}/${LOGIN_PATH}`;
  if (!query || Object.keys(query).length === 0) return base;
  const params = new URLSearchParams(query);
  return `${base}?${params.toString()}`;
}
