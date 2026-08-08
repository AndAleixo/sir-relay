/** Same-origin tracker path (Caddy → umami). */
export const UMAMI_SCRIPT_PATH = "/script.js";

/** Website id from env, or null when tracker should not inject. */
export function resolveUmamiWebsiteId(
  raw: string | undefined = process.env.UMAMI_WEBSITE_ID,
): string | null {
  const id = raw?.trim();
  return id ? id : null;
}
