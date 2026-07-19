import { writeAudit } from "@/lib/audit";
import { telegramConfigured } from "@/lib/telegram/config";
import {
  queueEmpty,
  taskNotify,
} from "@/lib/telegram/copy";
import { sendTelegramMessage } from "@/lib/telegram/send";
import type { Locale as DbLocale } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toLocale } from "@/services/api/mappers";

const QUEUE_ORDER_BY = [
  { sortOrder: "asc" as const },
  { dueDate: "asc" as const },
  { createdAt: "asc" as const },
];

function dueDateLabel(dueDate: Date | null): string | null {
  if (!dueDate) return null;
  return dueDate.toISOString().slice(0, 10);
}

function appOrigin(): string {
  return process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

function taskWebUrl(dbLocale: DbLocale, taskId: string): string {
  return `${appOrigin()}/${toLocale(dbLocale)}/tasks/${taskId}`;
}

/** Active Telegram queue: todo/doing with a prior notify still open. */
export async function hasActiveTelegramQueue(
  groupId: string,
  assigneeId: string,
  excludeTaskId?: string,
): Promise<boolean> {
  const count = await prisma.task.count({
    where: {
      groupId,
      assigneeId,
      status: { in: ["todo", "doing"] },
      telegramNotifiedAt: { not: null },
      ...(excludeTaskId ? { id: { not: excludeTaskId } } : {}),
    },
  });
  return count > 0;
}

async function sendAndPersistTaskNotify(taskId: string): Promise<boolean> {
  if (!telegramConfigured()) return false;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { telegramChatId: true, locale: true } },
      group: { select: { name: true } },
    },
  });
  if (!task?.assignee.telegramChatId) return false;

  const chatId = task.assignee.telegramChatId;
  const locale = task.assignee.locale as DbLocale;
  const text = taskNotify(locale, {
    title: task.title,
    description: task.description,
    dueDate: dueDateLabel(task.dueDate),
    groupName: task.group.name,
    taskUrl: taskWebUrl(locale, task.id),
  });

  try {
    const messageId = await sendTelegramMessage(chatId, text);
    await prisma.task.update({
      where: { id: taskId },
      data: {
        telegramMessageId: String(messageId),
        telegramChatId: chatId,
        telegramNotifiedAt: new Date(),
        telegramNotifyFailed: false,
      },
    });
    return true;
  } catch {
    await prisma.task.update({
      where: { id: taskId },
      data: { telegramNotifyFailed: true },
    });
    return false;
  }
}

async function findQueueHead(groupId: string, assigneeId: string) {
  const doing = await prisma.task.findFirst({
    where: { groupId, assigneeId, status: "doing" },
    orderBy: QUEUE_ORDER_BY,
  });
  if (doing) return doing;
  return prisma.task.findFirst({
    where: { groupId, assigneeId, status: "todo" },
    orderBy: QUEUE_ORDER_BY,
  });
}

/**
 * Ensure Telegram shows the queue head (doing, else top todo).
 * Clears active notify flags on other todo/doing tasks for this assignee.
 */
export async function syncAssigneeTelegramHead(
  groupId: string,
  assigneeId: string,
): Promise<void> {
  if (!telegramConfigured()) return;

  const head = await findQueueHead(groupId, assigneeId);
  if (!head) return;

  await prisma.task.updateMany({
    where: {
      groupId,
      assigneeId,
      status: { in: ["todo", "doing"] },
      id: { not: head.id },
      telegramNotifiedAt: { not: null },
    },
    data: {
      telegramMessageId: null,
      telegramChatId: null,
      telegramNotifiedAt: null,
    },
  });

  if (head.telegramNotifiedAt) return;
  await sendAndPersistTaskNotify(head.id);
}

/** Notify assignee if linked and their Telegram queue is empty. */
export async function notifyTaskIfEligible(taskId: string): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignee: { select: { telegramChatId: true } } },
  });
  if (!task) return;
  if (!task.assignee.telegramChatId) return;
  if (task.status === "done") return;

  const busy = await hasActiveTelegramQueue(task.groupId, task.assigneeId, taskId);
  if (busy) return;

  await sendAndPersistTaskNotify(taskId);
}

/** After a task is done: send next todo, or queue-empty message. */
export async function dispatchAfterDone(
  groupId: string,
  assigneeId: string,
): Promise<void> {
  if (!telegramConfigured()) return;

  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { telegramChatId: true, locale: true },
  });
  if (!assignee?.telegramChatId) return;

  const next = await prisma.task.findFirst({
    where: {
      groupId,
      assigneeId,
      status: "todo",
    },
    orderBy: QUEUE_ORDER_BY,
  });

  if (next) {
    const busy = await hasActiveTelegramQueue(groupId, assigneeId, next.id);
    if (!busy) {
      await sendAndPersistTaskNotify(next.id);
      void writeAudit({
        groupId,
        action: "relay_dispatch",
        actorType: "system",
        actorId: assigneeId,
        metadata: { taskId: next.id, title: next.title },
      });
    }
    return;
  }

  try {
    await sendTelegramMessage(
      assignee.telegramChatId,
      queueEmpty(assignee.locale as DbLocale),
    );
  } catch {
    // ponytail: empty-queue ping is best-effort
  }
}

/** Force resend of a task notification (operator renotify). */
export async function renotifyTaskTelegram(taskId: string): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignee: { select: { telegramChatId: true } } },
  });
  if (!task) throw new Error("Not found");
  if (!task.assignee.telegramChatId) {
    await prisma.task.update({
      where: { id: taskId },
      data: { telegramNotifyFailed: true },
    });
    return;
  }
  await sendAndPersistTaskNotify(taskId);
}

const DONE_KEYWORDS = new Set([
  "done",
  "hecho",
  "concluída",
  "concluida",
  "feito",
  "listo",
]);
const DOING_KEYWORDS = new Set([
  "in progress",
  "em progresso",
  "en progreso",
  "working",
]);

export function parseStatusKeyword(
  body: string,
): "done" | "doing" | null {
  const normalized = body.trim().toLowerCase().replace(/\s+/g, " ");
  if (DONE_KEYWORDS.has(normalized)) return "done";
  if (DOING_KEYWORDS.has(normalized)) return "doing";
  return null;
}
