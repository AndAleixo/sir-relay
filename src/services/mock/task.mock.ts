import type { Session, Task, TaskStatus } from "@/domain/types";
import type { TaskService } from "@/services/contracts";
import {
  MOCK_COMMENTS,
  MOCK_TASKS,
} from "@/services/mock/data";

function filterTasksForSession(tasks: Task[], session: Session): Task[] {
  const visible = tasks.filter((t) => !t.archived);
  if (session.user.role === "operator") return visible;
  return visible.filter((t) => t.assigneeId === session.user.id);
}

export class MockTaskService implements TaskService {
  private tasks = [...MOCK_TASKS];

  async listTasks(ctx: { session: Session }): Promise<Task[]> {
    return filterTasksForSession(this.tasks, ctx.session);
  }

  async getTask(id: string, ctx: { session: Session }): Promise<Task | null> {
    const task = this.tasks.find((t) => t.id === id && !t.archived);
    if (!task) return null;
    if (
      ctx.session.user.role === "teammate" &&
      task.assigneeId !== ctx.session.user.id
    ) {
      return null;
    }
    return task;
  }

  async listComments(taskId: string) {
    return MOCK_COMMENTS.filter((c) => c.taskId === taskId).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
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
}

export const mockTaskService = new MockTaskService();
