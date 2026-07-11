import { headers } from "next/headers";

/** Build absolute URL for invite/Telegram links in server components. */
export function resolveAppOrigin(): string {
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const host = headers().get("host");
  if (!host) return "http://localhost:3000";

  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export function joinInviteUrl(locale: string, token: string): string {
  return `${resolveAppOrigin()}/${locale}/join/${token}`;
}

export function telegramBotUrl(code: string): string {
  return `https://t.me/SirRelayBot?start=${code}`;
}
