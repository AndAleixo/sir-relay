import type { Task } from "@/domain/types";

/** Merge server rows into local by id — server wins when updatedAt >= local (LWW). */
export function applyServerTasks(local: Task[], incoming: Task[]): Task[] {
  if (incoming.length === 0) return local;
  const byId = new Map(incoming.map((task) => [task.id, task]));
  const seen = new Set<string>();
  const merged = local.map((task) => {
    const server = byId.get(task.id);
    if (!server) return task;
    seen.add(task.id);
    return server.updatedAt >= task.updatedAt ? server : task;
  });
  for (const task of incoming) {
    if (!seen.has(task.id)) merged.push(task);
  }
  return merged;
}

/** Blind RSC replace is unsafe while writes are in flight or queued. */
export function shouldAcceptServerSnapshot(input: {
  queueLength: number;
  inFlightCount: number;
}): boolean {
  return input.queueLength === 0 && input.inFlightCount === 0;
}
