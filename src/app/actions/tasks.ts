"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Task, TaskStatus } from "@/domain/types";
import type { SyncActionOptions, TaskActionResult } from "@/domain/sync";
import { requireOperatorSession } from "@/lib/require-session";
import { isGroupTimezone } from "@/lib/group-timezones";
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

export async function createTaskForm(locale: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const assigneeId = String(formData.get("assigneeId") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueRaw = String(formData.get("dueDate") ?? "").trim();

  if (!title || !assigneeId) {
    redirect(`/${locale}/tasks/new`);
  }

  const session = await requireOperatorSession(locale);
  const { tasks } = getServices();

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
  const { auth, alerts } = getServices();
  const session = await auth.getSession();
  if (!session || session.user.role !== "operator") return;

  const patch: Partial<import("@/services/alert.types").OperatorAlertPrefs> = {};

  if (formData.has("taskDone")) {
    patch.taskDone = formData.get("taskDone") === "on";
  }
  if (formData.has("taskDue")) {
    patch.taskDue = formData.get("taskDue") === "on";
  }
  if (formData.has("timezone")) {
    const timezone = String(formData.get("timezone") ?? "");
    if (isGroupTimezone(timezone)) patch.timezone = timezone;
  }
  if (formData.has("quietHoursEnabled")) {
    const enabled = formData.get("quietHoursEnabled") === "on";
    if (!enabled) {
      patch.quietHoursStart = null;
      patch.quietHoursEnd = null;
    } else {
      patch.quietHoursStart = parseHour(formData.get("quietHoursStart"));
      patch.quietHoursEnd = parseHour(formData.get("quietHoursEnd"));
    }
  }

  if (Object.keys(patch).length === 0) return;

  await alerts.updatePrefs({ session }, patch);
  revalidatePath("/", "layout");
}

function parseHour(value: FormDataEntryValue | null): number | null {
  if (value == null || value === "") return null;
  const hour = Number(value);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  return hour;
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
    await alerts.notifyTaskDone(updated, { session });
  }

  if (options?.clientMutationId) {
    recordAppliedMutation(options.clientMutationId, updated);
  }

  maybeRevalidate();
  return { ok: true, task: updated };
}

export async function quickCreateTaskAction(
  locale: string,
  input: { title: string; assigneeId: string },
): Promise<
  | { ok: true; task: Task }
  | { ok: false; error: "forbidden" | "invalid" }
> {
  const title = input.title.trim();
  const assigneeId = input.assigneeId.trim();

  if (!title || !assigneeId) {
    return { ok: false, error: "invalid" };
  }

  const { auth, tasks } = getServices();
  const session = await auth.getSession();
  if (!session || session.user.role !== "operator") {
    return { ok: false, error: "forbidden" };
  }

  const task = await tasks.createTask(
    {
      title,
      assigneeId,
      description: "",
      dueDate: null,
    },
    { session },
  );

  maybeRevalidate();
  revalidatePath(`/${locale}/tasks`);
  return { ok: true, task };
}

export async function updateTaskFieldsAction(
  taskId: string,
  fields: { title?: string; dueDate?: string | null; description?: string },
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

  const updated = await tasks.updateTaskFields(taskId, fields, { session });

  if (options?.clientMutationId) {
    recordAppliedMutation(options.clientMutationId, updated);
  }

  maybeRevalidate();
  return { ok: true, task: updated };
}

export async function saveTaskDetailAction(
  locale: string,
  taskId: string,
  formData: FormData,
): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueRaw = String(formData.get("dueDate") ?? "").trim();
  const status = String(formData.get("status") ?? "") as TaskStatus;
  const assigneeId = String(formData.get("assigneeId") ?? "").trim();

  if (!title) return;
  if (!["todo", "doing", "done"].includes(status)) return;

  const { auth, tasks, teammates, alerts } = getServices();
  const session = await auth.getSession();
  if (!session) return;

  const existing = await tasks.getTask(taskId, { session });
  if (!existing) return;

  await tasks.updateTaskFields(
    taskId,
    {
      title,
      description,
      dueDate: dueRaw || null,
    },
    { session },
  );

  if (existing.status !== status) {
    const updated = await tasks.updateTaskStatus(taskId, status, { session });
    if (existing.status !== "done" && status === "done") {
      await alerts.notifyTaskDone(updated, { session });
    }
  }

  if (
    session.user.role === "operator" &&
    assigneeId &&
    assigneeId !== existing.assigneeId
  ) {
    let assigneeName = session.user.name;
    if (assigneeId !== session.user.id) {
      const teammate = await teammates.getTeammate(assigneeId, { session });
      if (!teammate) return;
      assigneeName = teammate.name;
    }
    await tasks.reassignTask(taskId, assigneeId, assigneeName, { session });
  }

  revalidatePath(`/${locale}/tasks`);
  revalidatePath(`/${locale}/tasks/${taskId}`);
}

export async function deleteTaskAction(locale: string, taskId: string): Promise<void> {
  const { auth, tasks } = getServices();
  const session = await auth.getSession();
  if (!session) return;

  const existing = await tasks.getTask(taskId, { session });
  if (!existing) return;

  await tasks.deleteTask(taskId, { session });
  revalidatePath(`/${locale}/tasks`);
  redirect(`/${locale}/tasks`);
}

export async function renotifyTaskAction(locale: string, taskId: string) {
  const session = await requireOperatorSession(locale);
  const { tasks } = getServices();

  await tasks.renotifyTask(taskId, { session });
  revalidatePath(`/${locale}/tasks/${taskId}`);
  redirect(`/${locale}/tasks/${taskId}?renotify=1`);
}
