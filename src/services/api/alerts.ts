import type { OperatorAlert, Session, Task } from "@/domain/types";
import type { OperatorAlertPrefs, OperatorAlertService } from "@/services/alert.types";
import {
  calendarDateInTimezone,
  isDueOnOrBeforeTodayInTimezone,
} from "@/lib/group-timezones";
import { prisma } from "@/lib/prisma";
import {
  telegramDeliveryAllowed,
  toOperatorAlertPrefs,
} from "@/services/alert-prefs";
import { apiTaskService } from "@/services/api/tasks";

function requireGroupId(ctx: { session: Session }): string {
  const groupId = ctx.session.activeGroupId;
  if (!groupId) throw new Error("No active group");
  return groupId;
}

async function defaultPrefs(groupId: string): Promise<OperatorAlertPrefs> {
  const row = await prisma.groupAlertPrefs.upsert({
    where: { groupId },
    create: { groupId },
    update: {},
  });
  return toOperatorAlertPrefs(row);
}

async function hasLinkedOperator(groupId: string): Promise<boolean> {
  const row = await prisma.groupMembership.findFirst({
    where: {
      groupId,
      role: "operator",
      user: { telegramChatId: { not: null } },
    },
  });
  return Boolean(row);
}

export class ApiOperatorAlertService implements OperatorAlertService {
  async getPrefs(ctx: { session: Session }): Promise<OperatorAlertPrefs> {
    return defaultPrefs(requireGroupId(ctx));
  }

  async updatePrefs(
    ctx: { session: Session },
    next: Partial<OperatorAlertPrefs>,
  ): Promise<OperatorAlertPrefs> {
    const groupId = requireGroupId(ctx);
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
    const groupId = requireGroupId(ctx);
    const taskIds = new Set(
      (await apiTaskService.listTasks(ctx)).map((task) => task.id),
    );
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

    const linked = await hasLinkedOperator(groupId);
    await prisma.operatorAlert.create({
      data: {
        groupId,
        type: "task_done",
        taskId: task.id,
        taskTitle: task.title,
        assigneeName: task.assigneeName,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        sentToTelegram: linked && telegramDeliveryAllowed(prefs),
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

      const linked = await hasLinkedOperator(groupId);
      await prisma.operatorAlert.create({
        data: {
          groupId,
          type: "task_due",
          taskId: task.id,
          taskTitle: task.title,
          assigneeName: task.assigneeName,
          dueDate: new Date(task.dueDate),
          sentToTelegram: linked && telegramDeliveryAllowed(prefs, now),
        },
      });
    }
  }
}

export const apiOperatorAlertService = new ApiOperatorAlertService();
