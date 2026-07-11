import type { Task, TaskStatus } from "@/domain/types";

export type TaskListSort = "due" | "status" | "updated";

const statusOrder: Record<TaskStatus, number> = {
  todo: 0,
  doing: 1,
  done: 2,
};

export function sortTasksForList(tasks: Task[], sort: TaskListSort): Task[] {
  const copy = [...tasks];

  copy.sort((a, b) => {
    if (sort === "due") {
      if (!a.dueDate && !b.dueDate) return a.title.localeCompare(b.title);
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title);
    }

    if (sort === "status") {
      const byStatus = statusOrder[a.status] - statusOrder[b.status];
      return byStatus || b.updatedAt.localeCompare(a.updatedAt);
    }

    return b.updatedAt.localeCompare(a.updatedAt);
  });

  return copy;
}
