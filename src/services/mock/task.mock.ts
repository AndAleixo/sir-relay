import type { Session, Task, TaskStatus } from "@/domain/types";
import type { CreateTaskInput } from "@/services/contracts";
import type { TaskService } from "@/services/contracts";
import {
  MOCK_OPERATORS,
  MOCK_TASKS,
  MOCK_TEAMMATES,
} from "@/services/mock/data";

function filterTasksForSession(tasks: Task[], session: Session): Task[] {
  if (session.user.role === "operator") return tasks;
  return tasks.filter((t) => t.assigneeId === session.user.id);
}

function resolveAssignee(
  assigneeId: string,
  session: Session,
): { assigneeId: string; assigneeName: string } {
  if (assigneeId === session.user.id && session.user.role === "operator") {
    return { assigneeId: session.user.id, assigneeName: session.user.name };
  }

  const teammate = MOCK_TEAMMATES.find((t) => t.id === assigneeId && t.active);
  if (teammate) {
    return { assigneeId: teammate.id, assigneeName: teammate.name };
  }

  const operator = MOCK_OPERATORS.find((op) => op.id === assigneeId && op.active);
  if (operator) {
    return { assigneeId: operator.id, assigneeName: operator.name };
  }

  throw new Error("Invalid assignee");
}

export class MockTaskService implements TaskService {
  private tasks = [...MOCK_TASKS];

  async listTasks(ctx: { session: Session }): Promise<Task[]> {
    return filterTasksForSession(this.tasks, ctx.session);
  }

  async getTask(id: string, ctx: { session: Session }): Promise<Task | null> {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    if (
      ctx.session.user.role === "teammate" &&
      task.assigneeId !== ctx.session.user.id
    ) {
      return null;
    }
    return task;
  }

  async createTask(input: CreateTaskInput, ctx: { session: Session }): Promise<Task> {
    if (ctx.session.user.role !== "operator") {
      throw new Error("Forbidden");
    }

    const title = input.title.trim();
    if (!title) throw new Error("Title required");

    const { assigneeId, assigneeName } = resolveAssignee(input.assigneeId, ctx.session);
    const now = new Date().toISOString();

    const task: Task = {
      id: `task-${Date.now()}`,
      title: title.slice(0, 200),
      description: (input.description ?? "").trim().slice(0, 10_000),
      assigneeId,
      assigneeName,
      status: "todo",
      dueDate: input.dueDate ?? null,
      telegramNotifyFailed: false,
      updatedAt: now,
      createdAt: now,
    };

    this.tasks.push(task);
    return task;
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    ctx: { session: Session },
  ): Promise<Task> {
    const task = await this.getTask(id, ctx);
    if (!task) throw new Error("Task not found");
    const updated = {
      ...task,
      status,
      updatedAt: new Date().toISOString(),
    };
    this.tasks = this.tasks.map((t) => (t.id === id ? updated : t));
    return updated;
  }

  async reassignTask(
    id: string,
    assigneeId: string,
    assigneeName: string,
    ctx: { session: Session },
  ): Promise<Task> {
    if (ctx.session.user.role !== "operator") {
      throw new Error("Forbidden");
    }
    const task = await this.getTask(id, ctx);
    if (!task) throw new Error("Task not found");
    const updated = {
      ...task,
      assigneeId,
      assigneeName,
      updatedAt: new Date().toISOString(),
    };
    this.tasks = this.tasks.map((t) => (t.id === id ? updated : t));
    return updated;
  }

  async updateTaskFields(
    id: string,
    fields: { title?: string; dueDate?: string | null; description?: string },
    ctx: { session: Session },
  ): Promise<Task> {
    const task = await this.getTask(id, ctx);
    if (!task) throw new Error("Task not found");

    const title =
      fields.title !== undefined ? fields.title.trim().slice(0, 200) : task.title;
    if (!title) throw new Error("Title required");

    const dueDate =
      fields.dueDate !== undefined ? fields.dueDate || null : task.dueDate;

    const description =
      fields.description !== undefined
        ? fields.description.trim().slice(0, 10_000)
        : task.description;

    const updated = {
      ...task,
      title,
      description,
      dueDate,
      updatedAt: new Date().toISOString(),
    };
    this.tasks = this.tasks.map((t) => (t.id === id ? updated : t));
    return updated;
  }

  async deleteTask(id: string, ctx: { session: Session }): Promise<void> {
    const task = await this.getTask(id, ctx);
    if (!task) throw new Error("Task not found");
    this.tasks = this.tasks.filter((t) => t.id !== id);
  }

  async renotifyTask(id: string, ctx: { session: Session }): Promise<Task> {
    if (ctx.session.user.role !== "operator") {
      throw new Error("Forbidden");
    }
    const task = await this.getTask(id, ctx);
    if (!task) throw new Error("Task not found");

    const updated = {
      ...task,
      telegramNotifyFailed: false,
      updatedAt: new Date().toISOString(),
    };
    this.tasks = this.tasks.map((t) => (t.id === id ? updated : t));
    return updated;
  }
}

export const mockTaskService = new MockTaskService();
