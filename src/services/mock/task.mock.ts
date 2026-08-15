import type { Session, Task, TaskDifficulty, TaskStatus } from "@/domain/types";
import type { CreateTaskInput, TaskService } from "@/services/contracts";
import { assertCanCreateTask, assertCanMutateTask } from "@/lib/authz";
import { insertIdAfter, sortByQueueOrder } from "@/lib/task-queue";
import { MOCK_TASKS } from "@/services/mock/data";
import { groupMemberLabel } from "@/lib/group-member-label";
import {
  getMembershipDisplayName,
  getMembershipRole,
  userIdsInGroup,
} from "@/services/mock/groups.mock";
import { findMockUserById } from "@/services/mock/users.mock";
import { mockCopyOpenProject, mockProjectTag } from "@/services/mock/projects.mock";

function tasksInGroup(tasks: Task[], session: Session): Task[] {
  const groupId = session.activeGroupId;
  if (!groupId) return [];
  const ids = userIdsInGroup(groupId);
  return tasks.filter((t) => ids.has(t.assigneeId));
}

function liveAssigneeName(groupId: string, assigneeId: string): string {
  const displayName = getMembershipDisplayName(groupId, assigneeId);
  const user = findMockUserById(assigneeId);
  if (!user) return displayName?.trim() || assigneeId;
  return groupMemberLabel({ ...user, displayName });
}

function withLiveAssigneeName(task: Task, session: Session): Task {
  const groupId = session.activeGroupId;
  if (!groupId) return task;
  const assigneeName = liveAssigneeName(groupId, task.assigneeId);
  return assigneeName === task.assigneeName ? task : { ...task, assigneeName };
}

function resolveAssignee(
  assigneeId: string,
  session: Session,
): { assigneeId: string; assigneeName: string } {
  const groupId = session.activeGroupId;
  if (!groupId) throw new Error("Invalid assignee");

  const ids = userIdsInGroup(groupId);
  if (!ids.has(assigneeId)) throw new Error("Invalid assignee");

  return {
    assigneeId,
    assigneeName: liveAssigneeName(groupId, assigneeId),
  };
}

export class MockTaskService implements TaskService {
  private tasks = [...MOCK_TASKS];

  removeAssignedTasks(assigneeId: string): void {
    // ponytail: mock tasks have no groupId; production deletion is group-scoped.
    this.tasks = this.tasks.filter((task) => task.assigneeId !== assigneeId);
  }

  countAssignedTasks(assigneeId: string): number {
    return this.tasks.filter((task) => task.assigneeId === assigneeId).length;
  }

  async listTasks(ctx: { session: Session }): Promise<Task[]> {
    return tasksInGroup(this.tasks, ctx.session).map((task) =>
      withLiveAssigneeName(task, ctx.session),
    );
  }

  async getTask(id: string, ctx: { session: Session }): Promise<Task | null> {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    const visible = tasksInGroup([task], ctx.session);
    const found = visible[0];
    return found ? withLiveAssigneeName(found, ctx.session) : null;
  }

  async createTask(input: CreateTaskInput, ctx: { session: Session }): Promise<Task> {
    assertCanCreateTask(ctx.session, input.assigneeId);

    const title = input.title.trim();
    if (!title) throw new Error("Title required");

    const { assigneeId, assigneeName } = resolveAssignee(input.assigneeId, ctx.session);
    const now = new Date().toISOString();

    const sameAssignee = this.tasks.filter(
      (t) => t.assigneeId === input.assigneeId && t.status !== "done",
    );
    const sortOrder =
      sameAssignee.reduce((max, t) => Math.max(max, t.sortOrder), -1) + 1;

    const task: Task = {
      id: `task-${Date.now()}`,
      title: title.slice(0, 200),
      description: (input.description ?? "").trim().slice(0, 10_000),
      assigneeId,
      assigneeName,
      status: "todo",
      dueDate: input.dueDate ?? null,
      difficulty: input.difficulty ?? null,
      telegramNotifyFailed: false,
      sortOrder,
      ...mockProjectTag(ctx.session, input.projectId),
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
    assertCanMutateTask(ctx.session, task);

    let sortOrder = task.sortOrder;
    if (task.status === "done" && status !== "done") {
      const peers = this.tasks.filter(
        (t) => t.assigneeId === task.assigneeId && t.status !== "done",
      );
      sortOrder = peers.reduce((max, t) => Math.max(max, t.sortOrder), -1) + 1;
    }

    const updated = {
      ...task,
      status,
      sortOrder,
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
    resolveAssignee(assigneeId, ctx.session);
    const task = await this.getTask(id, ctx);
    if (!task) throw new Error("Task not found");

    let sortOrder = task.sortOrder;
    if (task.status !== "done") {
      const peers = this.tasks.filter(
        (t) => t.assigneeId === assigneeId && t.status !== "done" && t.id !== id,
      );
      sortOrder = peers.reduce((max, t) => Math.max(max, t.sortOrder), -1) + 1;
    }

    const updated = {
      ...task,
      assigneeId,
      assigneeName,
      sortOrder,
      updatedAt: new Date().toISOString(),
    };
    this.tasks = this.tasks.map((t) => (t.id === id ? updated : t));
    return updated;
  }

  async updateTaskFields(
    id: string,
    fields: {
      title?: string;
      dueDate?: string | null;
      description?: string;
      difficulty?: TaskDifficulty | null;
      projectId?: string | null;
    },
    ctx: { session: Session },
  ): Promise<Task> {
    const task = await this.getTask(id, ctx);
    if (!task) throw new Error("Task not found");
    assertCanMutateTask(ctx.session, task);

    const title =
      fields.title !== undefined ? fields.title.trim().slice(0, 200) : task.title;
    if (!title) throw new Error("Title required");

    const dueDate =
      fields.dueDate !== undefined ? fields.dueDate || null : task.dueDate;

    const description =
      fields.description !== undefined
        ? fields.description.trim().slice(0, 10_000)
        : task.description;

    const difficulty =
      fields.difficulty !== undefined ? fields.difficulty : task.difficulty;

    const project =
      fields.projectId === undefined
        ? { projectId: task.projectId, projectAcronym: task.projectAcronym }
        : mockProjectTag(ctx.session, fields.projectId, task.projectId);

    const updated = {
      ...task,
      title,
      description,
      dueDate,
      difficulty,
      ...project,
      updatedAt: new Date().toISOString(),
    };
    this.tasks = this.tasks.map((t) => (t.id === id ? updated : t));
    return updated;
  }

  async deleteTask(id: string, ctx: { session: Session }): Promise<void> {
    const task = await this.getTask(id, ctx);
    if (!task) throw new Error("Task not found");
    assertCanMutateTask(ctx.session, task);
    this.tasks = this.tasks.filter((t) => t.id !== id);
  }

  async renotifyTask(id: string, ctx: { session: Session }): Promise<Task> {
    if (ctx.session.user.role !== "operator") {
      throw new Error("Forbidden");
    }
    const task = await this.getTask(id, ctx);
    if (!task) throw new Error("Task not found");

    const groupId = ctx.session.activeGroupId;
    if (!groupId || !getMembershipRole(groupId, task.assigneeId)) {
      throw new Error("Assignee not in group");
    }

    const updated = {
      ...task,
      telegramNotifyFailed: false,
      updatedAt: new Date().toISOString(),
    };
    this.tasks = this.tasks.map((t) => (t.id === id ? updated : t));
    return updated;
  }

  async cloneTask(sourceId: string, ctx: { session: Session }): Promise<Task[]> {
    const existing = await this.getTask(sourceId, ctx);
    if (!existing) throw new Error("Not found");
    assertCanCreateTask(ctx.session, existing.assigneeId);

    const now = new Date().toISOString();
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const orderedIds = sortByQueueOrder(
      this.tasks.filter(
        (t) =>
          t.assigneeId === existing.assigneeId && t.status === existing.status,
      ),
    ).map((t) => t.id);
    const nextIds = insertIdAfter(orderedIds, sourceId, id);

    const cloneTag = mockCopyOpenProject(ctx.session, existing.projectId);
    const clone: Task = {
      id,
      title: existing.title,
      description: existing.description,
      assigneeId: existing.assigneeId,
      assigneeName: existing.assigneeName,
      status: existing.status,
      dueDate: existing.dueDate,
      difficulty: existing.difficulty,
      telegramNotifyFailed: false,
      sortOrder: nextIds.indexOf(id),
      ...cloneTag,
      updatedAt: now,
      createdAt: now,
    };
    this.tasks.push(clone);

    const order = new Map(nextIds.map((taskId, i) => [taskId, i]));
    this.tasks = this.tasks.map((t) => {
      const sortOrder = order.get(t.id);
      return sortOrder === undefined ? t : { ...t, sortOrder, updatedAt: now };
    });

    return tasksInGroup(this.tasks, ctx.session).map((row) =>
      withLiveAssigneeName(row, ctx.session),
    );
  }

  async placeInTodoQueue(
    taskId: string,
    assigneeId: string,
    orderedTodoIds: string[],
    ctx: { session: Session },
  ): Promise<Task[]> {
    if (
      ctx.session.user.role !== "operator" &&
      assigneeId !== ctx.session.user.id
    ) {
      throw new Error("Forbidden");
    }

    resolveAssignee(assigneeId, ctx.session);
    const task = await this.getTask(taskId, ctx);
    if (!task) throw new Error("Not found");
    if (
      ctx.session.user.role !== "operator" &&
      task.assigneeId !== ctx.session.user.id
    ) {
      throw new Error("Forbidden");
    }

    const uniqueIds = Array.from(new Set(orderedTodoIds));
    if (!uniqueIds.includes(taskId)) throw new Error("Task missing from queue");

    const now = new Date().toISOString();
    const { assigneeName } = resolveAssignee(assigneeId, ctx.session);

    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          assigneeId,
          assigneeName,
          status: "todo" as const,
          updatedAt: now,
        };
      }
      return t;
    });

    const todos = this.tasks.filter(
      (t) => t.assigneeId === assigneeId && t.status === "todo",
    );
    if (
      uniqueIds.length !== todos.length ||
      !todos.every((t) => uniqueIds.includes(t.id))
    ) {
      throw new Error("Invalid todo queue");
    }

    const order = new Map(uniqueIds.map((id, i) => [id, i]));
    this.tasks = this.tasks.map((t) => {
      const sortOrder = order.get(t.id);
      if (sortOrder === undefined) return t;
      return { ...t, sortOrder, updatedAt: now };
    });

    return tasksInGroup(this.tasks, ctx.session).map((row) =>
      withLiveAssigneeName(row, ctx.session),
    );
  }
}

export const mockTaskService = new MockTaskService();

export function removeMockTasksAssignedTo(assigneeId: string): void {
  mockTaskService.removeAssignedTasks(assigneeId);
}

export function countMockTasksAssignedTo(assigneeId: string): number {
  return mockTaskService.countAssignedTasks(assigneeId);
}
