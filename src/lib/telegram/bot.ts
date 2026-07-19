import { Bot } from "grammy";
import type { Session, Task } from "@/domain/types";
import { groupMemberLabel } from "@/lib/group-member-label";
import { prisma } from "@/lib/prisma";
import { toLocale } from "@/services/api/mappers";
import { apiOperatorAlertService } from "@/services/api/alerts";
import { telegramBotToken, telegramConfigured } from "@/lib/telegram/config";
import {
  alreadyLinked,
  chatTaken,
  linkInvalid,
  replyToTaskHint,
  startWithoutCode,
  statusAck,
  welcomeLinked,
} from "@/lib/telegram/copy";
import { linkTelegramChat } from "@/lib/telegram/link";
import {
  dispatchAfterDone,
  parseStatusKeyword,
} from "@/lib/telegram/relay";
import {
  sanitizeTelegramLinkCode,
  sanitizeTelegramText,
} from "@/lib/telegram/sanitize";

export { telegramConfigured };

let botInstance: Bot | null = null;

export function getTelegramBot(): Bot {
  const token = telegramBotToken();
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
    const code = sanitizeTelegramLinkCode(ctx.match ?? "");

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

  bot.on("message:text", async (ctx) => {
    const chatId = String(ctx.chat.id);
    const user = await prisma.user.findFirst({
      where: { telegramChatId: chatId },
    });
    if (!user) return;

    const body = sanitizeTelegramText(ctx.message.text ?? "");
    if (!body) return;

    const replyTo = ctx.message.reply_to_message;
    if (!replyTo?.message_id) {
      await ctx.reply(replyToTaskHint(user.locale));
      return;
    }

    const repliedId = String(replyTo.message_id);
    const taskRow = await prisma.task.findFirst({
      where: {
        telegramMessageId: repliedId,
        assigneeId: user.id,
        status: { in: ["todo", "doing"] },
      },
      include: {
        group: {
          include: {
            memberships: {
              where: { userId: user.id },
              take: 1,
            },
          },
        },
      },
    });
    if (!taskRow) {
      await ctx.reply(replyToTaskHint(user.locale));
      return;
    }

    const keyword = parseStatusKeyword(body);
    const membership = taskRow.group.memberships[0];
    const displayName = membership?.displayName ?? null;
    const assigneeLabel = groupMemberLabel({
      name: user.name,
      email: user.email,
      displayName,
    });

    await prisma.$transaction(async (tx) => {
      await tx.telegramActivity.create({
        data: {
          groupId: taskRow.groupId,
          taskId: taskRow.id,
          userId: user.id,
          body,
          source: "telegram",
        },
      });
      if (keyword) {
        await tx.task.update({
          where: { id: taskRow.id },
          data: { status: keyword },
        });
      }
    });

    if (keyword) {
      await ctx.reply(statusAck(user.locale, keyword));
    }

    if (keyword === "done") {
      await dispatchAfterDone(taskRow.groupId, user.id);

      const task: Task = {
        id: taskRow.id,
        title: taskRow.title,
        description: taskRow.description,
        assigneeId: taskRow.assigneeId,
        assigneeName: assigneeLabel,
        status: "done",
        dueDate: taskRow.dueDate ? taskRow.dueDate.toISOString().slice(0, 10) : null,
        telegramNotifyFailed: taskRow.telegramNotifyFailed,
        sortOrder: taskRow.sortOrder,
        updatedAt: new Date().toISOString(),
        createdAt: taskRow.createdAt.toISOString(),
      };

      const session: Session = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: membership?.role === "operator" ? "operator" : "teammate",
          locale: toLocale(user.locale),
          active: user.active,
        },
        activeGroupId: taskRow.groupId,
      };

      await apiOperatorAlertService.notifyTaskDone(task, { session });
    }
  });

  return bot;
}
