export const MAX_OPEN_PROJECTS = 8;
export const PROJECT_NAME_MAX = 20;

/** 2–4 Latin letters, stored uppercase. */
export function parseProjectAcronym(raw: string): string | null {
  const acronym = raw.trim().toUpperCase();
  if (!/^[A-Z]{2,4}$/.test(acronym)) return null;
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
