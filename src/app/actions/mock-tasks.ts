"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TaskStatus } from "@/domain/types";
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

export async function mockCreateTask(locale: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const assigneeId = String(formData.get("assigneeId") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueRaw = String(formData.get("dueDate") ?? "").trim();

  if (!title || !assigneeId) {
    redirect(`/${locale}/tasks/new`);
  }

  const { auth, tasks } = getServices();
  const session = await auth.getSession();
  if (!session || session.user.role !== "operator") {
    redirect(`/${locale}/tasks`);
  }

  await tasks.createTask(
    {
      title,
      assigneeId,
      description,
      dueDate: dueRaw || null,
    },
    { session },
  );

  revalidatePath(`/${locale}/tasks`);
  redirect(`/${locale}/tasks`);
}

export async function updateOperatorAlertPrefs(formData: FormData) {
  const taskDone = formData.get("taskDone") === "on";
  const taskDue = formData.get("taskDue") === "on";

  const { auth, alerts } = getServices();
  const session = await auth.getSession();
  if (!session || session.user.role !== "operator") return;

  await alerts.updatePrefs({ taskDone, taskDue });
  revalidatePath("/", "layout");
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

  const { auth, tasks, alerts } = getServices();
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

  if (existing.status !== "done" && status === "done") {
    await alerts.notifyTaskDone(updated);
  }

  if (options?.clientMutationId) {
    recordAppliedMutation(options.clientMutationId, updated);
  }

  maybeRevalidate();
  return { ok: true, task: updated };
}
