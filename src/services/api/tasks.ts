import type { Session, Task, TaskStatus } from "@/domain/types";
import type { CreateTaskInput, TaskService } from "@/services/contracts";
import { prisma } from "@/lib/prisma";
import { toTask } from "@/services/api/mappers";

function requireGroupId(session: Session): string {
  const groupId = session.activeGroupId;
  if (!groupId) throw new Error("No active group");
  return groupId;
}

async function assigneeName(assigneeId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { name: true },
  });
  return user?.name ?? "Unknown";
}

async function assertAssigneeInGroup(groupId: string, assigneeId: string) {
  const member = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: assigneeId } },
  });
  if (!member) throw new Error("Invalid assignee");
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
        names.set(row.assigneeId, await assigneeName(row.assigneeId));
      }
    }
    return rows.map((row) => toTask(row, names.get(row.assigneeId)!));
  }

  async listTasks(ctx: { session: Session }): Promise<Task[]> {
    return this.visibleTasks(ctx.session);
  }

  async getTask(id: string, ctx: { session: Session }): Promise<Task | null> {
    const tasks = await this.visibleTasks(ctx.session);
    return tasks.find((task) => task.id === id) ?? null;
  }

  async createTask(input: CreateTaskInput, ctx: { session: Session }): Promise<Task> {
    if (ctx.session.user.role !== "operator") throw new Error("Forbidden");

    const groupId = requireGroupId(ctx.session);
    const title = input.title.trim();
    if (!title) throw new Error("Title required");

    await assertAssigneeInGroup(groupId, input.assigneeId);
    const name = await assigneeName(input.assigneeId);
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
    return toTask(row, name);
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    ctx: { session: Session },
  ): Promise<Task> {
    const existing = await this.getTask(id, ctx);
    if (!existing) throw new Error("Not found");

    const row = await prisma.task.update({
      where: { id },
      data: { status: status as "todo" | "doing" | "done" },
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

    const existing = await this.getTask(id, ctx);
    if (!existing) throw new Error("Not found");

    const row = await prisma.task.update({
      where: { id },
      data: { assigneeId },
    });
    return toTask(row, assigneeName);
  }

  async updateTaskFields(
    id: string,
    fields: { title?: string; dueDate?: string | null; description?: string },
    ctx: { session: Session },
  ): Promise<Task> {
    const existing = await this.getTask(id, ctx);
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
    const existing = await this.getTask(id, ctx);
    if (!existing) throw new Error("Not found");
    await prisma.task.delete({ where: { id } });
  }

  async renotifyTask(id: string, ctx: { session: Session }): Promise<Task> {
    if (ctx.session.user.role !== "operator") throw new Error("Forbidden");
    const existing = await this.getTask(id, ctx);
    if (!existing) throw new Error("Not found");
    const row = await prisma.task.update({
      where: { id },
      data: { telegramNotifiedAt: new Date() },
    });
    return toTask(row, existing.assigneeName);
  }
}

export const apiTaskService = new ApiTaskService();
