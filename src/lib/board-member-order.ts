import type { Task } from "@/domain/types";

/**
 * Team board: other members by To do count (desc), then label.
 * Call when the Tasks page opens; client keeps that array in useState (no re-sort).
 */
export function orderMembersByTodoCount<T extends { id: string }>(
  members: T[],
  tasks: Pick<Task, "assigneeId" | "status">[],
  labelOf: (member: T) => string,
): T[] {
  const counts = new Map<string, number>();
  for (const member of members) counts.set(member.id, 0);
  for (const task of tasks) {
    if (task.status !== "todo") continue;
    if (!counts.has(task.assigneeId)) continue;
    counts.set(task.assigneeId, (counts.get(task.assigneeId) ?? 0) + 1);
  }
  return [...members].sort((a, b) => {
    const byCount = (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0);
    if (byCount !== 0) return byCount;
    return labelOf(a).localeCompare(labelOf(b));
  });
}
