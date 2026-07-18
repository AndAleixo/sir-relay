import { Bot } from "grammy";
import { telegramBotToken, telegramConfigured } from "@/lib/telegram/config";

// ponytail: separate Bot instance without handlers — avoids cycle with webhook bot.
let sendBot: Bot | null = null;

function apiBot(): Bot {
  const token = telegramBotToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  if (!sendBot) sendBot = new Bot(token);
  return sendBot;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<number> {
  if (!telegramConfigured()) {
    throw new Error("telegram_not_configured");
  }
  const message = await apiBot().api.sendMessage(chatId, text, {
    link_preview_options: { is_disabled: true },
  });
  return message.message_id;
}
