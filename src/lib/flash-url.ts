/**
 * One-shot success query flags. Errors (`error`, `*Error`, `session`) stay in the URL.
 */
const SUCCESS_FLASH_KEYS = [
  "saved",
  "deleted",
  "renotify",
  "passwordChanged",
  "nameSaved",
  "renamed",
  "displayNameSaved",
  "promoted",
  "demoted",
  "invited",
  "resent",
  "transferred",
] as const;

/** Strip success flash keys. Returns `null` if nothing to strip; else `""` or `?…`. */
export function stripSuccessFlash(search: string): string | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  let changed = false;
  for (const key of SUCCESS_FLASH_KEYS) {
    if (!params.has(key)) continue;
    params.delete(key);
    changed = true;
  }
  if (!changed) return null;
  const query = params.toString();
  return query ? `?${query}` : "";
}
