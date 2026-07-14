import { Bot } from "grammy";
import { prisma } from "@/lib/prisma";
import {
  alreadyLinked,
  chatTaken,
  linkInvalid,
  startWithoutCode,
  welcomeLinked,
} from "@/lib/telegram/copy";
import { linkTelegramChat } from "@/lib/telegram/link";

function botToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || undefined;
}

export function telegramConfigured(): boolean {
  return Boolean(botToken() && process.env.TELEGRAM_WEBHOOK_SECRET?.trim());
}

let botInstance: Bot | null = null;

export function getTelegramBot(): Bot {
  const token = botToken();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }
  if (!botInstance) {
    botInstance = createBot(token);
  }
  return botInstance;
}

function createBot(token: string): Bot {
  const bot = new Bot(token);

  bot.command("start", async (ctx) => {
    const chatId = String(ctx.chat.id);
    const code = ctx.match?.trim();

    if (!code) {
      const linked = await prisma.user.findFirst({
        where: { telegramChatId: chatId },
        select: { name: true, locale: true },
      });
      if (linked) {
        await ctx.reply(alreadyLinked(linked.name, linked.locale));
        return;
      }
      await ctx.reply(startWithoutCode("en"));
      return;
    }

    const result = await linkTelegramChat(code, chatId);
    if (!result.ok) {
      await ctx.reply(result.reason === "chat_taken" ? chatTaken("en") : linkInvalid("en"));
      return;
    }

    const message = result.alreadyLinked
      ? alreadyLinked(result.name, result.locale)
      : welcomeLinked(result.name, result.locale, result.operator);
    await ctx.reply(message);
  });

  return bot;
}
