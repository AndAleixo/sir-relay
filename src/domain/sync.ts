import type { Task, TaskStatus } from "@/domain/types";

export type MutationType =
  | "update_status"
  | "reassign"
  | "update_fields"
  | "move_task";

export type MutationPayload =
  | { status: TaskStatus }
  | { assigneeId: string; assigneeName: string }
  | {
      title?: string;
      dueDate?: string | null;
      description?: string;
      projectId?: string | null;
      categoryId?: string | null;
    }
  | {
      status: TaskStatus;
      assigneeId: string;
      assigneeName: string;
      /** Required when status is todo — full todo queue for that assignee. */
      orderedTodoIds?: string[];
    };

export interface PendingMutation {
  clientMutationId: string;
  type: MutationType;
  taskId: string;
  payload: MutationPayload;
  baseUpdatedAt: string;
}

export interface MutationInput {
  type: MutationType;
  taskId: string;
  payload: MutationPayload;
}

export interface SyncConflict {
  mutation: PendingMutation;
  serverTask: Task;
}

export type TaskActionResult =
  | { ok: true; task: Task; /** Extra rows to LWW-merge (e.g. todo reorder peers). */ affected?: Task[] }
  | { ok: false; error: "conflict"; task: Task }
  | { ok: false; error: "forbidden" | "unauthorized" | "not_found" | "network" };

/** P3-OFF-03: only transient failures stay in the retry queue. */
export function isRetryableSyncError(
  error: Extract<TaskActionResult, { ok: false }>["error"],
): boolean {
  return error === "network";
}

export function isMoveTaskPayload(
  payload: MutationPayload,
): payload is {
  status: TaskStatus;
  assigneeId: string;
  assigneeName: string;
  orderedTodoIds?: string[];
} {
  return (
    "status" in payload &&
    "assigneeId" in payload &&
    "assigneeName" in payload
  );
}

export interface SyncActionOptions {
  clientMutationId?: string;
  baseUpdatedAt?: string;
}
