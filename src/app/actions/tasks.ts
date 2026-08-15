"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Task, TaskStatus } from "@/domain/types";
import type { SyncActionOptions, TaskActionResult } from "@/domain/sync";
import { assertCanCreateTask } from "@/lib/authz";
import { loginPath } from "@/lib/entry-route";
import { requireAppSession, requireOperatorSession } from "@/lib/require-session";
import { groupMemberLabel } from "@/lib/group-member-label";
import { isGroupTimezone } from "@/lib/group-timezones";
import {
  coerceTasksProject,
  coerceTasksScope,
  coerceTasksView,
  taskDetailHref,
  taskNewHref,
  tasksListHrefFromReturn,
} from "@/lib/tasks-url";
import { parseTaskDifficulty } from "@/lib/task-difficulty";
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

function returnFields(formData: FormData) {
  return {
    scope: String(formData.get("returnScope") ?? "") || undefined,
    view: String(formData.get("returnView") ?? "") || undefined,
    project: String(formData.get("returnProject") ?? "") || undefined,
  };
}

function returnHrefOpts(formData: FormData) {
  const { scope, view, project } = returnFields(formData);
  return {
    scope: coerceTasksScope(scope),
    view: coerceTasksView(view),
    project: coerceTasksProject(project) ?? null,
  };
}

export async function createTaskForm(locale: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueRaw = String(formData.get("dueDate") ?? "").trim();
  const difficulty = parseTaskDifficulty(formData.get("difficulty"));
  const projectId = String(formData.get("projectId") ?? "").trim() || null;
  const returnOpts = returnHrefOpts(formData);

  const session = await requireAppSession(locale);
  const assigneeId =
    session.user.role === "teammate"
      ? session.user.id
      : String(formData.get("assigneeId") ?? "").trim();

  if (!title || !assigneeId) {
    redirect(
      taskNewHref(locale, {
        ...returnOpts,
        error: !title ? "title" : "assignee",
      }),
    );
  }

  const { tasks } = getServices();

  try {
    await tasks.createTask(
      {
        title,
        assigneeId,
        description,
        dueDate: dueRaw || null,
        difficulty,
        projectId,
      },
      { session },
    );
  } catch {
    redirect(
      taskNewHref(locale, {
        ...returnOpts,
        error: "failed",
      }),
    );
  }

  revalidatePath(`/${locale}/tasks`);
  redirect(
    tasksListHrefFromReturn(
      locale,
      session.user.role,
      returnOpts.scope,
      returnOpts.view,
      { saved: true },
      returnOpts.project ?? undefined,
    ),
  );
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
  input: { title: string; assigneeId: string; projectId?: string | null },
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
  if (!session?.activeGroupId) {
    return { ok: false, error: "forbidden" };
  }
  try {
    assertCanCreateTask(session, assigneeId);
  } catch {
    return { ok: false, error: "forbidden" };
  }

  const task = await tasks.createTask(
    {
      title,
      assigneeId,
      description: "",
      dueDate: null,
      projectId: input.projectId ?? null,
    },
    { session },
  );

  maybeRevalidate();
  revalidatePath(`/${locale}/tasks`);
  return { ok: true, task };
}

export async function cloneTaskAction(
  taskId: string,
): Promise<
  | { ok: true; tasks: Task[] }
  | { ok: false; error: "unauthorized" | "forbidden" | "not_found" | "failed" }
> {
  const { auth, tasks } = getServices();
  const session = await auth.getSession();
  if (!session) return { ok: false, error: "unauthorized" };

  try {
    const updated = await tasks.cloneTask(taskId, { session });
    maybeRevalidate();
    return { ok: true, tasks: updated };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Forbidden") return { ok: false, error: "forbidden" };
      if (error.message === "Not found" || error.message === "Task not found") {
        return { ok: false, error: "not_found" };
      }
    }
    return { ok: false, error: "failed" };
  }
}

export async function deleteTaskInlineAction(
  taskId: string,
): Promise<
  | { ok: true }
  | { ok: false; error: "unauthorized" | "forbidden" | "not_found" | "failed" }
> {
  const { auth, tasks } = getServices();
  const session = await auth.getSession();
  if (!session) return { ok: false, error: "unauthorized" };

  const existing = await tasks.getTask(taskId, { session });
  if (!existing) return { ok: false, error: "not_found" };

  try {
    await tasks.deleteTask(taskId, { session });
    maybeRevalidate();
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return { ok: false, error: "forbidden" };
    }
    return { ok: false, error: "failed" };
  }
}

export async function placeInTodoQueueAction(
  taskId: string,
  assigneeId: string,
  orderedTodoIds: string[],
): Promise<
  | { ok: true; tasks: Task[] }
  | { ok: false; error: "unauthorized" | "invalid" }
> {
  const { auth, tasks } = getServices();
  const session = await auth.getSession();
  if (!session) {
    return { ok: false, error: "unauthorized" };
  }

  try {
    const updated = await tasks.placeInTodoQueue(
      taskId,
      assigneeId,
      orderedTodoIds,
      { session },
    );
    maybeRevalidate();
    return { ok: true, tasks: updated };
  } catch {
    return { ok: false, error: "invalid" };
  }
}

export async function updateTaskFieldsAction(
  taskId: string,
  fields: {
    title?: string;
    dueDate?: string | null;
    description?: string;
    projectId?: string | null;
  },
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
  const returnOpts = returnHrefOpts(formData);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueRaw = String(formData.get("dueDate") ?? "").trim();
  const difficulty = parseTaskDifficulty(formData.get("difficulty"));
  const projectId = String(formData.get("projectId") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "") as TaskStatus;
  const assigneeId = String(formData.get("assigneeId") ?? "").trim();

  function detailError(error: string): never {
    redirect(taskDetailHref(locale, taskId, { ...returnOpts, error }));
  }

  if (!title) detailError("title");
  if (!["todo", "doing", "done"].includes(status)) detailError("status");

  const { auth, tasks, teammates, alerts } = getServices();
  const session = await auth.getSession();
  if (!session) redirect(loginPath(locale, { session: "expired" }));

  const existing = await tasks.getTask(taskId, { session });
  if (!existing) {
    redirect(
      tasksListHrefFromReturn(
        locale,
        session.user.role,
        returnOpts.scope,
        returnOpts.view,
        { error: "not_found" },
        returnOpts.project ?? undefined,
      ),
    );
  }

  try {
    await tasks.updateTaskFields(
      taskId,
      {
        title,
        description,
        dueDate: dueRaw || null,
        difficulty,
        projectId,
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
      let assigneeName = groupMemberLabel(session.user);
      if (assigneeId !== session.user.id) {
        const member = await teammates.getOrganizationUser(assigneeId, {
          session,
        });
        if (!member) detailError("assignee");
        assigneeName = groupMemberLabel(member);
      } else {
        const orgUsers = await teammates.listOrganizationUsers({ session });
        const me = orgUsers.find((user) => user.id === session.user.id);
        assigneeName = groupMemberLabel({
          ...session.user,
          displayName: me?.displayName,
        });
      }
      await tasks.reassignTask(taskId, assigneeId, assigneeName, { session });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      detailError("forbidden");
    }
    detailError("failed");
  }

  revalidatePath(`/${locale}/tasks`);
  revalidatePath(`/${locale}/tasks/${taskId}`);
  redirect(
    tasksListHrefFromReturn(
      locale,
      session.user.role,
      returnOpts.scope,
      returnOpts.view,
      { saved: true },
      returnOpts.project ?? undefined,
    ),
  );
}

export async function deleteTaskAction(
  locale: string,
  taskId: string,
  returnTo?: { scope?: string; view?: string; project?: string | null },
): Promise<void> {
  const { auth, tasks } = getServices();
  const session = await auth.getSession();
  if (!session) redirect(loginPath(locale, { session: "expired" }));

  const returnOpts = {
    scope: coerceTasksScope(returnTo?.scope),
    view: coerceTasksView(returnTo?.view),
    project: coerceTasksProject(returnTo?.project ?? undefined) ?? null,
  };

  const existing = await tasks.getTask(taskId, { session });
  if (!existing) {
    redirect(
      tasksListHrefFromReturn(
        locale,
        session.user.role,
        returnOpts.scope,
        returnOpts.view,
        { error: "not_found" },
        returnOpts.project ?? undefined,
      ),
    );
  }

  try {
    await tasks.deleteTask(taskId, { session });
  } catch (error) {
    redirect(
      taskDetailHref(locale, taskId, {
        ...returnOpts,
        error:
          error instanceof Error && error.message === "Forbidden"
            ? "forbidden"
            : "failed",
      }),
    );
  }

  revalidatePath(`/${locale}/tasks`);
  redirect(
    tasksListHrefFromReturn(
      locale,
      session.user.role,
      returnOpts.scope,
      returnOpts.view,
      { deleted: true },
      returnOpts.project ?? undefined,
    ),
  );
}

export async function renotifyTaskAction(
  locale: string,
  taskId: string,
  formData: FormData,
) {
  const returnOpts = returnHrefOpts(formData);
  const session = await requireOperatorSession(locale);
  const { tasks, teammates } = getServices();

  const task = await tasks.getTask(taskId, { session });
  if (!task) {
    redirect(
      tasksListHrefFromReturn(
        locale,
        session.user.role,
        returnOpts.scope,
        returnOpts.view,
        { error: "not_found" },
        returnOpts.project ?? undefined,
      ),
    );
  }
  const assignee = await teammates.getOrganizationUser(task.assigneeId, {
    session,
  });
  if (!assignee) {
    redirect(taskDetailHref(locale, taskId, { ...returnOpts, error: "failed" }));
  }

  await tasks.renotifyTask(taskId, { session });
  revalidatePath(`/${locale}/tasks/${taskId}`);
  redirect(taskDetailHref(locale, taskId, { ...returnOpts, renotify: true }));
}
