/**
 * P2-SEC-09 — sanitize inbound Telegram text before persist / keyword parse.
 * Keeps \n and \t; strips other C0/C1 controls and NULs.
 */

const MAX_TELEGRAM_BODY = 2000;

/** Control chars except TAB (09) and LF (0A). */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

export function sanitizeTelegramText(
  input: string,
  maxLen = MAX_TELEGRAM_BODY,
): string {
  return input.replace(CONTROL_CHARS, "").trim().slice(0, maxLen);
}

/** Link /start codes: printable non-space only, short. */
export function sanitizeTelegramLinkCode(input: string): string {
  return input.replace(/[^\x21-\x7E]/g, "").trim().slice(0, 128);
}
