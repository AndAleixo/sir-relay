import type { Session, Task, TaskStatus } from "@/domain/types";
import type { CreateTaskInput, TaskService } from "@/services/contracts";
import { writeAuditFromSession } from "@/lib/audit";
import { assertCanCreateTask, assertCanMutateTask } from "@/lib/authz";
import { groupMemberLabel } from "@/lib/group-member-label";
import { prisma } from "@/lib/prisma";
import {
  dispatchAfterDone,
  notifyTaskIfEligible,
  renotifyTaskTelegram,
  syncAssigneeTelegramHead,
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

async function nextSortOrder(groupId: string, assigneeId: string): Promise<number> {
  const agg = await prisma.task.aggregate({
    where: { groupId, assigneeId, status: { not: "done" } },
    _max: { sortOrder: true },
  });
  return (agg._max.sortOrder ?? -1) + 1;
}

async function loadTask(id: string, session: Session): Promise<Task | null> {
  const groupId = requireGroupId(session);
  // Any group member may read any task in the group (Team scope). Mutations use assertCanMutateTask.
  const row = await prisma.task.findFirst({
    where: { id, groupId },
  });
  if (!row) return null;
  const name = await assigneeName(groupId, row.assigneeId);
  return toTask(row, name);
}

export class ApiTaskService implements TaskService {
  private async visibleTasks(session: Session): Promise<Task[]> {
    const groupId = requireGroupId(session);
    const rows = await prisma.task.findMany({
      where: { groupId },
      // List/export order — boards re-sort To do via sortByQueueOrder.
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
    assertCanCreateTask(ctx.session, input.assigneeId);

    const groupId = requireGroupId(ctx.session);
    const title = input.title.trim();
    if (!title) throw new Error("Title required");

    await assertAssigneeInGroup(groupId, input.assigneeId);
    const name = await assigneeName(groupId, input.assigneeId);
    const id = `task-${Date.now()}`;
    const sortOrder = await nextSortOrder(groupId, input.assigneeId);

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
        sortOrder,
      },
    });

    await notifyTaskIfEligible(id);
    const refreshed = await prisma.task.findUniqueOrThrow({ where: { id } });
    const task = toTask(refreshed, name);
    void writeAuditFromSession(ctx.session, "task_create", {
      taskId: id,
      title: input.title,
      assigneeId: input.assigneeId,
    });
    return task;
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    ctx: { session: Session },
  ): Promise<Task> {
    const existing = await loadTask(id, ctx.session);
    if (!existing) throw new Error("Not found");
    assertCanMutateTask(ctx.session, existing);

    const sortOrder =
      existing.status === "done" && status !== "done"
        ? await nextSortOrder(requireGroupId(ctx.session), existing.assigneeId)
        : undefined;

    const row = await prisma.task.update({
      where: { id },
      data: {
        status: status as "todo" | "doing" | "done",
        ...(sortOrder !== undefined ? { sortOrder } : {}),
      },
    });

    if (existing.status !== "done" && status === "done") {
      await dispatchAfterDone(row.groupId, row.assigneeId);
    } else if (status !== "done") {
      await syncAssigneeTelegramHead(row.groupId, row.assigneeId);
    }

    void writeAuditFromSession(ctx.session, "task_status", {
      taskId: id,
      title: existing.title,
      from: existing.status,
      to: status,
    });
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

    const sortOrder =
      existing.status !== "done"
        ? await nextSortOrder(groupId, assigneeId)
        : existing.sortOrder;

    const row = await prisma.task.update({
      where: { id },
      data: {
        assigneeId,
        sortOrder,
        telegramMessageId: null,
        telegramChatId: null,
        telegramNotifiedAt: null,
        telegramNotifyFailed: false,
      },
    });

    if (row.status !== "done") {
      await notifyTaskIfEligible(id);
      if (existing.assigneeId !== assigneeId) {
        await syncAssigneeTelegramHead(groupId, existing.assigneeId);
      }
    }

    const refreshed = await prisma.task.findUniqueOrThrow({ where: { id } });
    void writeAuditFromSession(ctx.session, "task_reassign", {
      taskId: id,
      title: existing.title,
      fromAssigneeId: existing.assigneeId,
      toAssigneeId: assigneeId,
    });
    return toTask(refreshed, assigneeName);
  }

  async updateTaskFields(
    id: string,
    fields: { title?: string; dueDate?: string | null; description?: string },
    ctx: { session: Session },
  ): Promise<Task> {
    const existing = await loadTask(id, ctx.session);
    if (!existing) throw new Error("Not found");
    assertCanMutateTask(ctx.session, existing);

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
    void writeAuditFromSession(ctx.session, "task_update", {
      taskId: id,
      title: fields.title?.trim() || existing.title,
    });
    return toTask(row, existing.assigneeName);
  }

  async deleteTask(id: string, ctx: { session: Session }): Promise<void> {
    const existing = await loadTask(id, ctx.session);
    if (!existing) throw new Error("Not found");
    assertCanMutateTask(ctx.session, existing);
    const groupId = requireGroupId(ctx.session);
    await prisma.task.delete({ where: { id } });
    if (existing.status !== "done") {
      await syncAssigneeTelegramHead(groupId, existing.assigneeId);
    }
    void writeAuditFromSession(ctx.session, "task_delete", {
      taskId: id,
      title: existing.title,
    });
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
    void writeAuditFromSession(ctx.session, "task_renotify", {
      taskId: id,
      title: existing.title,
    });
    return toTask(refreshed, existing.assigneeName);
  }

  async placeInTodoQueue(
    taskId: string,
    assigneeId: string,
    orderedTodoIds: string[],
    ctx: { session: Session },
  ): Promise<Task[]> {
    const groupId = requireGroupId(ctx.session);
    const isOperator = ctx.session.user.role === "operator";

    if (!isOperator && assigneeId !== ctx.session.user.id) {
      throw new Error("Forbidden");
    }

    await assertAssigneeInGroup(groupId, assigneeId);

    const uniqueIds = Array.from(new Set(orderedTodoIds));
    if (uniqueIds.length !== orderedTodoIds.length) {
      throw new Error("Duplicate task ids");
    }
    if (!uniqueIds.includes(taskId)) {
      throw new Error("Task missing from queue");
    }

    const task = await prisma.task.findFirst({
      where: isOperator
        ? { id: taskId, groupId }
        : { id: taskId, groupId, assigneeId: ctx.session.user.id },
    });
    if (!task) throw new Error("Not found");

    const previousAssigneeId = task.assigneeId;

    await prisma.task.update({
      where: { id: taskId },
      data: {
        assigneeId,
        status: "todo",
        ...(previousAssigneeId !== assigneeId
          ? {
              telegramMessageId: null,
              telegramChatId: null,
              telegramNotifiedAt: null,
              telegramNotifyFailed: false,
            }
          : {}),
      },
    });

    const rows = await prisma.task.findMany({
      where: {
        groupId,
        assigneeId,
        status: "todo",
        id: { in: uniqueIds },
      },
      select: { id: true },
    });
    if (rows.length !== uniqueIds.length) {
      throw new Error("Invalid todo queue");
    }

    const allTodos = await prisma.task.findMany({
      where: { groupId, assigneeId, status: "todo" },
      select: { id: true },
    });
    if (allTodos.length !== uniqueIds.length) {
      throw new Error("Must include all todos");
    }

    await prisma.$transaction(
      uniqueIds.map((id, sortOrder) =>
        prisma.task.update({
          where: { id },
          data: { sortOrder },
        }),
      ),
    );

    await syncAssigneeTelegramHead(groupId, assigneeId);
    if (previousAssigneeId !== assigneeId) {
      await syncAssigneeTelegramHead(groupId, previousAssigneeId);
    }

    void writeAuditFromSession(ctx.session, "task_queue", {
      taskId,
      assigneeId,
    });

    return this.visibleTasks(ctx.session);
  }
}

export const apiTaskService = new ApiTaskService();
