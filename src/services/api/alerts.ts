import type { OperatorAlert, Session, Task } from "@/domain/types";
import type { OperatorAlertPrefs, OperatorAlertService } from "@/services/alert.types";
import type { Locale as DbLocale } from "@prisma/client";
import {
  calendarDateInTimezone,
  isDueOnOrBeforeTodayInTimezone,
} from "@/lib/group-timezones";
import { requireActiveGroupId, requireOperator } from "@/lib/authz";
import { formatTaskHeading } from "@/lib/project";
import { prisma } from "@/lib/prisma";
import {
  telegramDeliveryAllowed,
  toOperatorAlertPrefs,
} from "@/services/alert-prefs";
import { telegramConfigured } from "@/lib/telegram/config";
import {
  operatorAlertDone,
  operatorAlertDue,
} from "@/lib/telegram/copy";
import { sendTelegramMessage } from "@/lib/telegram/send";

function requireGroupId(ctx: { session: Session }): string {
  return requireActiveGroupId(ctx.session);
}

function requireOperatorGroup(ctx: { session: Session }): string {
  return requireOperator(ctx.session);
}

async function defaultPrefs(groupId: string): Promise<OperatorAlertPrefs> {
  const row = await prisma.groupAlertPrefs.upsert({
    where: { groupId },
    create: { groupId },
    update: {},
  });
  return toOperatorAlertPrefs(row);
}

async function linkedOperatorChats(
  groupId: string,
): Promise<{ chatId: string; locale: DbLocale }[]> {
  const rows = await prisma.groupMembership.findMany({
    where: {
      groupId,
      role: "operator",
      user: { telegramChatId: { not: null } },
    },
    include: { user: { select: { telegramChatId: true, locale: true } } },
  });
  return rows
    .filter((row) => row.user.telegramChatId)
    .map((row) => ({
      chatId: row.user.telegramChatId!,
      locale: row.user.locale as DbLocale,
    }));
}

async function deliverOperatorAlertDms(
  groupId: string,
  prefs: OperatorAlertPrefs,
  textForLocale: (locale: DbLocale) => string,
  now = new Date(),
): Promise<boolean> {
  if (!telegramConfigured()) return false;
  if (!telegramDeliveryAllowed(prefs, now)) return false;

  const operators = await linkedOperatorChats(groupId);
  if (operators.length === 0) return false;

  let anyOk = false;
  for (const op of operators) {
    try {
      await sendTelegramMessage(op.chatId, textForLocale(op.locale));
      anyOk = true;
    } catch {
      // continue other operators
    }
  }
  return anyOk;
}

export class ApiOperatorAlertService implements OperatorAlertService {
  async getPrefs(ctx: { session: Session }): Promise<OperatorAlertPrefs> {
    return defaultPrefs(requireOperatorGroup(ctx));
  }

  async updatePrefs(
    ctx: { session: Session },
    next: Partial<OperatorAlertPrefs>,
  ): Promise<OperatorAlertPrefs> {
    const groupId = requireOperatorGroup(ctx);
    await defaultPrefs(groupId);
    const row = await prisma.groupAlertPrefs.update({
      where: { groupId },
      data: {
        ...(next.taskDone !== undefined ? { taskDone: next.taskDone } : {}),
        ...(next.taskDue !== undefined ? { taskDue: next.taskDue } : {}),
        ...(next.timezone !== undefined ? { timezone: next.timezone } : {}),
        ...(next.quietHoursStart !== undefined
          ? { quietHoursStart: next.quietHoursStart }
          : {}),
        ...(next.quietHoursEnd !== undefined ? { quietHoursEnd: next.quietHoursEnd } : {}),
      },
    });
    return toOperatorAlertPrefs(row);
  }

  async listRecentAlerts(
    ctx: { session: Session },
    limit = 8,
  ): Promise<OperatorAlert[]> {
    const groupId = requireOperatorGroup(ctx);
    const taskRows = await prisma.task.findMany({
      where: { groupId },
      select: { id: true },
    });
    const taskIds = new Set(taskRows.map((row) => row.id));
    const rows = await prisma.operatorAlert.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows
      .filter((row) => taskIds.has(row.taskId))
      .slice(0, limit)
      .map((row) => ({
        id: row.id,
        type: row.type,
        taskId: row.taskId,
        taskTitle: row.taskTitle,
        assigneeName: row.assigneeName,
        dueDate: row.dueDate ? row.dueDate.toISOString().slice(0, 10) : null,
        createdAt: row.createdAt.toISOString(),
        sentToTelegram: row.sentToTelegram,
      }));
  }

  async notifyTaskDone(task: Task, ctx: { session: Session }): Promise<void> {
    const groupId = requireGroupId(ctx);
    const prefs = await defaultPrefs(groupId);
    if (!prefs.taskDone) return;

    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: { groupId, userId: task.assigneeId },
      },
    });
    if (!membership || membership.role !== "teammate") return;

    const at = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
    const sent = await deliverOperatorAlertDms(groupId, prefs, (locale) =>
      operatorAlertDone(locale, {
        taskTitle: formatTaskHeading(task.title, task.projectAcronym),
        assigneeName: task.assigneeName,
        at,
      }),
    );

    await prisma.operatorAlert.create({
      data: {
        groupId,
        type: "task_done",
        taskId: task.id,
        taskTitle: formatTaskHeading(task.title, task.projectAcronym),
        assigneeName: task.assigneeName,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        sentToTelegram: sent,
      },
    });
  }

  async syncDueAlerts(tasks: Task[], ctx: { session: Session }): Promise<void> {
    const groupId = requireGroupId(ctx);
    const prefs = await defaultPrefs(groupId);
    if (!prefs.taskDue) return;

    const now = new Date();
    const today = calendarDateInTimezone(now, prefs.timezone);

    for (const task of tasks) {
      if (task.status === "done") continue;
      if (!task.dueDate || !isDueOnOrBeforeTodayInTimezone(task.dueDate, prefs.timezone, now)) {
        continue;
      }

      const membership = await prisma.groupMembership.findUnique({
        where: {
          groupId_userId: { groupId, userId: task.assigneeId },
        },
      });
      if (!membership || membership.role !== "teammate") continue;

      const latest = await prisma.operatorAlert.findFirst({
        where: { groupId, type: "task_due", taskId: task.id },
        orderBy: { createdAt: "desc" },
      });
      if (
        latest &&
        calendarDateInTimezone(latest.createdAt, prefs.timezone) === today
      ) {
        continue;
      }

      const overdue = task.dueDate < today;
      const sent = await deliverOperatorAlertDms(
        groupId,
        prefs,
        (locale) =>
          operatorAlertDue(locale, {
            taskTitle: formatTaskHeading(task.title, task.projectAcronym),
            assigneeName: task.assigneeName,
            dueDate: task.dueDate!,
            overdue,
          }),
        now,
      );

      await prisma.operatorAlert.create({
        data: {
          groupId,
          type: "task_due",
          taskId: task.id,
          taskTitle: formatTaskHeading(task.title, task.projectAcronym),
          assigneeName: task.assigneeName,
          dueDate: new Date(task.dueDate),
          sentToTelegram: sent,
        },
      });
    }
  }
}

export const apiOperatorAlertService = new ApiOperatorAlertService();
