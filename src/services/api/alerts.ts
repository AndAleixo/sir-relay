import type { OperatorAlert, Session, Task } from "@/domain/types";
import { isDueOrOverdue } from "@/lib/dates";
import type { OperatorAlertPrefs, OperatorAlertService } from "@/services/alert.types";
import { prisma } from "@/lib/prisma";
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
  return { taskDone: row.taskDone, taskDue: row.taskDue };
}

async function hasLinkedOperator(groupId: string): Promise<boolean> {
  const row = await prisma.groupMembership.findFirst({
    where: { groupId, role: "operator" },
    include: { user: true },
  });
  return Boolean(row?.user.telegramChatId);
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
    const current = await defaultPrefs(groupId);
    const merged = { ...current, ...next };
    const row = await prisma.groupAlertPrefs.update({
      where: { groupId },
      data: merged,
    });
    return { taskDone: row.taskDone, taskDue: row.taskDue };
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

    await prisma.operatorAlert.create({
      data: {
        groupId,
        type: "task_done",
        taskId: task.id,
        taskTitle: task.title,
        assigneeName: task.assigneeName,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        sentToTelegram: await hasLinkedOperator(groupId),
      },
    });
  }

  async syncDueAlerts(tasks: Task[], ctx: { session: Session }): Promise<void> {
    const groupId = requireGroupId(ctx);
    const prefs = await defaultPrefs(groupId);
    if (!prefs.taskDue) return;

    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);

    for (const task of tasks) {
      if (task.status === "done") continue;
      if (!task.dueDate || !isDueOrOverdue(task.dueDate)) continue;

      const membership = await prisma.groupMembership.findUnique({
        where: {
          groupId_userId: { groupId, userId: task.assigneeId },
        },
      });
      if (!membership || membership.role !== "teammate") continue;

      const existing = await prisma.operatorAlert.findFirst({
        where: {
          groupId,
          type: "task_due",
          taskId: task.id,
          createdAt: { gte: dayStart },
        },
      });
      if (existing) continue;

      await prisma.operatorAlert.create({
        data: {
          groupId,
          type: "task_due",
          taskId: task.id,
          taskTitle: task.title,
          assigneeName: task.assigneeName,
          dueDate: new Date(task.dueDate),
          sentToTelegram: await hasLinkedOperator(groupId),
        },
      });
    }
  }
}

export const apiOperatorAlertService = new ApiOperatorAlertService();
