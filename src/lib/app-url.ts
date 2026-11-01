import { headers } from "next/headers";

/** Build absolute URL for invite/Telegram links in server components. */
export async function resolveAppOrigin(): Promise<string> {
  // ponytail: APP_URL wins in prod so invite links stay correct behind Caddy/Docker
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const h = await headers();
  const host =
    h.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h.get("host");
  if (host) {
    const protocol =
      host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

export async function joinInviteUrl(locale: string, token: string): Promise<string> {
  return `${await resolveAppOrigin()}/${locale}/join/${token}`;
}

export function telegramBotUrl(code: string): string {
  return `https://t.me/SirRelayBot?start=${code}`;
}
