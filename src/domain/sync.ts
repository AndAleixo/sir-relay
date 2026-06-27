import type { Task, TaskStatus } from "@/domain/types";

export type SyncState = "synced" | "syncing" | "failed" | "conflict";

export type MutationType = "update_status" | "reassign";

export type MutationPayload =
  | { status: TaskStatus }
  | { assigneeId: string; assigneeName: string };

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
  | { ok: true; task: Task }
  | { ok: false; error: "conflict"; task: Task }
  | { ok: false; error: "forbidden" | "unauthorized" | "not_found" | "network" };

export interface SyncActionOptions {
  clientMutationId?: string;
  baseUpdatedAt?: string;
}
