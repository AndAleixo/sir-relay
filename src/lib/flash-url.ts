/**
 * One-shot success query flags. Errors (`error`, `*Error`, `session`) stay in the URL.
 * Message paths are next-intl keys (`t("tasks.saved")`).
 */
export const SUCCESS_FLASH_MESSAGES = {
  saved: "tasks.saved",
  deleted: "tasks.deleted",
  renotify: "tasks.renotifyDone",
  passwordChanged: "auth.passwordChanged",
  nameSaved: "profile.nameSaved",
  renamed: "settings.groupRenamed",
  displayNameSaved: "settings.fantasyNameSaved",
  promoted: "teammate.promoted",
  demoted: "teammate.demoted",
  invited: "teammate.invitationCreated",
  resent: "teammate.invitationResent",
  transferred: "teammate.ownershipTransferred",
} as const;

export type SuccessFlashKey = keyof typeof SUCCESS_FLASH_MESSAGES;

const SUCCESS_FLASH_KEYS = Object.keys(
  SUCCESS_FLASH_MESSAGES,
) as SuccessFlashKey[];

export function readSuccessFlash(search: string): SuccessFlashKey | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  for (const key of SUCCESS_FLASH_KEYS) {
    if (params.get(key) === "1") return key;
  }
  return null;
}

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
