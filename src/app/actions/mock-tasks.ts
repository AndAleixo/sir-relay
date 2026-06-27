"use server";

import { revalidatePath } from "next/cache";
import type { Task, TaskStatus } from "@/domain/types";
import type { SyncActionOptions, TaskActionResult } from "@/domain/sync";
import { getServices, serviceMode } from "@/services";
import {
  getAppliedMutation,
  recordAppliedMutation,
} from "@/services/mock/sync-state.mock";

function maybeRevalidate() {
  if (serviceMode !== "mock") {
    revalidatePath("/", "layout");
  }
}

export async function reassignTaskAction(
  taskId: string,
  assigneeId: string,
  assigneeName: string,
  options?: SyncActionOptions,
): Promise<TaskActionResult> {
  if (options?.clientMutationId) {
    const cached = getAppliedMutation(options.clientMutationId);
    if (cached) return { ok: true, task: cached };
  }

  const { auth, tasks } = getServices();
  const session = await auth.getSession();
  if (!session || session.user.role !== "operator") {
    return { ok: false, error: "forbidden" };
  }

  const existing = await tasks.getTask(taskId, { session });
  if (!existing) return { ok: false, error: "not_found" };

  if (
    options?.baseUpdatedAt &&
    existing.updatedAt !== options.baseUpdatedAt
  ) {
    return { ok: false, error: "conflict", task: existing };
  }

  const updated = await tasks.reassignTask(
    taskId,
    assigneeId,
    assigneeName,
    { session },
  );

  if (options?.clientMutationId) {
    recordAppliedMutation(options.clientMutationId, updated);
  }

  maybeRevalidate();
  return { ok: true, task: updated };
}

export async function updateTaskStatusAction(
  taskId: string,
  status: TaskStatus,
  options?: SyncActionOptions,
): Promise<TaskActionResult> {
  if (options?.clientMutationId) {
    const cached = getAppliedMutation(options.clientMutationId);
    if (cached) return { ok: true, task: cached };
  }

  const { auth, tasks } = getServices();
  const session = await auth.getSession();
  if (!session) {
    return { ok: false, error: "unauthorized" };
  }

  const existing = await tasks.getTask(taskId, { session });
  if (!existing) return { ok: false, error: "not_found" };

  if (
    options?.baseUpdatedAt &&
    existing.updatedAt !== options.baseUpdatedAt
  ) {
    return { ok: false, error: "conflict", task: existing };
  }

  const updated = await tasks.updateTaskStatus(taskId, status, { session });

  if (options?.clientMutationId) {
    recordAppliedMutation(options.clientMutationId, updated);
  }

  maybeRevalidate();
  return { ok: true, task: updated };
}
