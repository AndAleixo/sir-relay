export const MAX_OPEN_PROJECTS = 8;
export const MAX_PENDING_PROJECTS = 2;
export const PROJECT_NAME_MAX = 20;
export const PROJECT_ACRONYM_MAX = 3;

/** Accepted (taggable): not archived and not a pending request. */
export const ACCEPTED_PROJECT = { archivedAt: null, pendingAt: null } as const;

export function isPendingProject(row: {
  archivedAt: string | Date | null;
  pendingAt: string | Date | null;
}): boolean {
  return row.archivedAt == null && row.pendingAt != null;
}

/** Pending requests first; caller order otherwise preserved. */
export function sortProjectsForSettings<T extends { pendingAt: string | null }>(
  rows: readonly T[],
): T[] {
  return [...rows].sort(
    (a, b) => Number(!!b.pendingAt) - Number(!!a.pendingAt),
  );
}

/** 1–3 Latin letters, stored uppercase. */
export function parseProjectAcronym(raw: string): string | null {
  const acronym = raw.trim().toUpperCase();
  if (!new RegExp(`^[A-Z]{1,${PROJECT_ACRONYM_MAX}}$`).test(acronym)) return null;
  return acronym;
}

export function parseProjectName(raw: string): string | null {
  const name = raw.trim().slice(0, PROJECT_NAME_MAX);
  return name.length >= 1 ? name : null;
}

export function formatTaskHeading(
  title: string,
  acronym: string | null | undefined,
): string {
  const code = acronym?.trim();
  return code ? `${code} · ${title}` : title;
}

export function tagFromOpenProjects(
  projectId: string | null,
  open: readonly { id: string; acronym: string }[],
  current?: { id: string | null; acronym: string | null },
): { projectId: string | null; projectAcronym: string | null } {
  if (!projectId) return { projectId: null, projectAcronym: null };
  const acronym =
    open.find((row) => row.id === projectId)?.acronym ??
    (current?.id === projectId ? current.acronym : null);
  return { projectId, projectAcronym: acronym };
}

/** Empty = untagged. Same as current (even if archived) = keep. Else must be open. */
export function resolveStoredProjectId(
  requested: string | null | undefined,
  currentId: string | null,
  openIds: readonly string[],
): string | null {
  const id = requested?.trim() ?? "";
  if (!id) return null;
  if (id === currentId) return currentId;
  if (!openIds.includes(id)) throw new Error("Invalid project");
  return id;
}
