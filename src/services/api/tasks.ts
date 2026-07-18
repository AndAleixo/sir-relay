import type { Session, Task, TaskStatus } from "@/domain/types";
import type { CreateTaskInput, TaskService } from "@/services/contracts";
import { groupMemberLabel } from "@/lib/group-member-label";
import { prisma } from "@/lib/prisma";
import {
  dispatchAfterDone,
  notifyTaskIfEligible,
  renotifyTaskTelegram,
} from "@/lib/telegram/relay";
import { toTask } from "@/services/api/mappers";

function requireGroupId(session: Session): string {
  const groupId = session.activeGroupId;
  if (!groupId) throw new Error("No active group");
  return groupId;
}

async function assigneeName(groupId: string, assigneeId: string): Promise<string> {
  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: assigneeId } },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!membership?.user) return "Unknown";
  return groupMemberLabel({
    name: membership.user.name,
    email: membership.user.email,
    displayName: membership.displayName,
  });
}

async function assertAssigneeInGroup(groupId: string, assigneeId: string) {
  const member = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: assigneeId } },
  });
  if (!member) throw new Error("Invalid assignee");
}

async function loadTask(id: string, session: Session): Promise<Task | null> {
  const groupId = requireGroupId(session);
  const row = await prisma.task.findFirst({
    where:
      session.user.role === "operator"
        ? { id, groupId }
        : { id, groupId, assigneeId: session.user.id },
  });
  if (!row) return null;
  const name = await assigneeName(groupId, row.assigneeId);
  return toTask(row, name);
}

export class ApiTaskService implements TaskService {
  private async visibleTasks(session: Session): Promise<Task[]> {
    const groupId = requireGroupId(session);
    const where =
      session.user.role === "operator"
        ? { groupId }
        : { groupId, assigneeId: session.user.id };

    const rows = await prisma.task.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    const names = new Map<string, string>();
    for (const row of rows) {
      if (!names.has(row.assigneeId)) {
        names.set(row.assigneeId, await assigneeName(groupId, row.assigneeId));
      }
    }
    return rows.map((row) => toTask(row, names.get(row.assigneeId)!));
  }

  async listTasks(ctx: { session: Session }): Promise<Task[]> {
    return this.visibleTasks(ctx.session);
  }

  async getTask(id: string, ctx: { session: Session }): Promise<Task | null> {
    return loadTask(id, ctx.session);
  }

  async createTask(input: CreateTaskInput, ctx: { session: Session }): Promise<Task> {
    if (ctx.session.user.role !== "operator") throw new Error("Forbidden");

    const groupId = requireGroupId(ctx.session);
    const title = input.title.trim();
    if (!title) throw new Error("Title required");

    await assertAssigneeInGroup(groupId, input.assigneeId);
    const name = await assigneeName(groupId, input.assigneeId);
    const id = `task-${Date.now()}`;

    const row = await prisma.task.create({
      data: {
        id,
        groupId,
        title: title.slice(0, 200),
        description: (input.description ?? "").trim().slice(0, 10_000),
        assigneeId: input.assigneeId,
        createdById: ctx.session.user.id,
        status: "todo",
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      },
    });

    await notifyTaskIfEligible(id);
    const refreshed = await prisma.task.findUniqueOrThrow({ where: { id } });
    return toTask(refreshed, name);
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    ctx: { session: Session },
  ): Promise<Task> {
    const existing = await loadTask(id, ctx.session);
    if (!existing) throw new Error("Not found");

    const row = await prisma.task.update({
      where: { id },
      data: { status: status as "todo" | "doing" | "done" },
    });

    if (existing.status !== "done" && status === "done") {
      await dispatchAfterDone(row.groupId, row.assigneeId);
    }

    return toTask(row, existing.assigneeName);
  }

  async reassignTask(
    id: string,
    assigneeId: string,
    assigneeName: string,
    ctx: { session: Session },
  ): Promise<Task> {
    if (ctx.session.user.role !== "operator") throw new Error("Forbidden");
    const groupId = requireGroupId(ctx.session);
    await assertAssigneeInGroup(groupId, assigneeId);

    const existing = await loadTask(id, ctx.session);
    if (!existing) throw new Error("Not found");

    const row = await prisma.task.update({
      where: { id },
      data: {
        assigneeId,
        telegramMessageId: null,
        telegramChatId: null,
        telegramNotifiedAt: null,
        telegramNotifyFailed: false,
      },
    });

    if (row.status !== "done") {
      await notifyTaskIfEligible(id);
    }

    const refreshed = await prisma.task.findUniqueOrThrow({ where: { id } });
    return toTask(refreshed, assigneeName);
  }

  async updateTaskFields(
    id: string,
    fields: { title?: string; dueDate?: string | null; description?: string },
    ctx: { session: Session },
  ): Promise<Task> {
    const existing = await loadTask(id, ctx.session);
    if (!existing) throw new Error("Not found");

    const row = await prisma.task.update({
      where: { id },
      data: {
        title: fields.title?.trim().slice(0, 200),
        description: fields.description?.trim().slice(0, 10_000),
        dueDate:
          fields.dueDate === undefined
            ? undefined
            : fields.dueDate
              ? new Date(fields.dueDate)
              : null,
      },
    });
    return toTask(row, existing.assigneeName);
  }

  async deleteTask(id: string, ctx: { session: Session }): Promise<void> {
    const existing = await loadTask(id, ctx.session);
    if (!existing) throw new Error("Not found");
    await prisma.task.delete({ where: { id } });
  }

  async renotifyTask(id: string, ctx: { session: Session }): Promise<Task> {
    if (ctx.session.user.role !== "operator") throw new Error("Forbidden");
    const existing = await loadTask(id, ctx.session);
    if (!existing) throw new Error("Not found");

    const groupId = requireGroupId(ctx.session);
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: { groupId, userId: existing.assigneeId },
      },
    });
    if (!membership) {
      throw new Error("Assignee not in group");
    }

    await renotifyTaskTelegram(id);
    const refreshed = await prisma.task.findUniqueOrThrow({ where: { id } });
    return toTask(refreshed, existing.assigneeName);
  }
}

export const apiTaskService = new ApiTaskService();
