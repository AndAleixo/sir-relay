import { headers } from "next/headers";

/** Build absolute URL for invite/Telegram links in server components. */
export function resolveAppOrigin(): string {
  const host = headers().get("host");
  if (host) {
    const protocol =
      host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  const configured = process.env.APP_URL?.replace(/\/$/, "");
  return configured ?? "http://localhost:3000";
}

export function joinInviteUrl(locale: string, token: string): string {
  return `${resolveAppOrigin()}/${locale}/join/${token}`;
}

export function telegramBotUrl(code: string): string {
  return `https://t.me/SirRelayBot?start=${code}`;
}
