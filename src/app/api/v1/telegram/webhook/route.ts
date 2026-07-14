import { webhookCallback } from "grammy";
import { NextResponse } from "next/server";
import { getTelegramBot, telegramConfigured } from "@/lib/telegram/bot";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!telegramConfigured()) {
    return NextResponse.json({ error: "telegram_not_configured" }, { status: 503 });
  }

  const handler = webhookCallback(getTelegramBot(), "std/http", {
    secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
  });

  return handler(request);
}
