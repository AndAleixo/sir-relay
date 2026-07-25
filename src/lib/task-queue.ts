import type { Task, TaskStatus } from "@/domain/types";

/** Drop index that appends after all current To do cards. */
export const TODO_QUEUE_APPEND = Number.MAX_SAFE_INTEGER;

/** Lower sortOrder = higher priority (top of To do). */
function compareQueueOrder(
  a: { sortOrder: number; dueDate: string | null; createdAt: string },
  b: { sortOrder: number; dueDate: string | null; createdAt: string },
): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
    return a.dueDate.localeCompare(b.dueDate);
  }
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  return a.createdAt.localeCompare(b.createdAt);
}

export function sortByQueueOrder<T extends {
  sortOrder: number;
  dueDate: string | null;
  createdAt: string;
}>(tasks: T[]): T[] {
  return [...tasks].sort(compareQueueOrder);
}

/** Active Telegram head: doing first, else top todo. */
export function pickQueueHead<T extends {
  id: string;
  status: TaskStatus;
  sortOrder: number;
  dueDate: string | null;
  createdAt: string;
}>(tasks: T[]): T | null {
  const active = tasks.filter((t) => t.status === "todo" || t.status === "doing");
  const doing = sortByQueueOrder(active.filter((t) => t.status === "doing"));
  if (doing[0]) return doing[0];
  const todos = sortByQueueOrder(active.filter((t) => t.status === "todo"));
  return todos[0] ?? null;
}

/** Place taskId at toIndex among others (board drop: index excludes the dragged card). */
export function placeIdAtIndex(
  orderedIds: string[],
  taskId: string,
  toIndex: number,
): string[] {
  const others = orderedIds.filter((id) => id !== taskId);
  const idx = Math.max(0, Math.min(toIndex, others.length));
  const next = [...others];
  next.splice(idx, 0, taskId);
  return next;
}

/** Insert newId immediately after afterId (append if afterId missing). */
export function insertIdAfter(
  orderedIds: string[],
  afterId: string,
  newId: string,
): string[] {
  const without = orderedIds.filter((id) => id !== newId);
  const idx = without.indexOf(afterId);
  if (idx < 0) return [...without, newId];
  const next = [...without];
  next.splice(idx + 1, 0, newId);
  return next;
}

/** Full To do id list for assignee after placing taskId at toIndex. */
export function buildTodoQueueOrder(
  tasks: Array<{
    id: string;
    assigneeId: string;
    status: TaskStatus;
    sortOrder: number;
    dueDate: string | null;
    createdAt: string;
  }>,
  assigneeId: string,
  taskId: string,
  toIndex: number,
): string[] {
  const others = sortByQueueOrder(
    tasks.filter(
      (t) =>
        t.assigneeId === assigneeId &&
        t.status === "todo" &&
        t.id !== taskId,
    ),
  ).map((t) => t.id);
  return placeIdAtIndex(others, taskId, toIndex);
}

export function groupTasksByStatusOrdered(tasks: Task[]): Record<
  "todo" | "doing" | "done",
  Task[]
> {
  return {
    todo: sortByQueueOrder(tasks.filter((t) => t.status === "todo")),
    doing: sortByQueueOrder(tasks.filter((t) => t.status === "doing")),
    done: sortByQueueOrder(tasks.filter((t) => t.status === "done")),
  };
}
