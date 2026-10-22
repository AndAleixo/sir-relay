/** Shared HTTPS client for /api/v1/client/* — origin/token only from process env (no tool SSRF). */

export const UPGRADE_MCP_MESSAGE =
  "This SRelay MCP is out of date. Update @sirrelay/mcp to the latest version, then create a new key in Profile (or /connect).";

/** Reject path tricks; ids are opaque server strings (e.g. task-…). */
export function assertSafeId(id: string, label: string): string {
  const trimmed = id.trim();
  if (!trimmed || trimmed.length > 128 || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(trimmed)) {
    throw new Error(`invalid_${label}`);
  }
  return trimmed;
}

export function appOrigin(raw: string | undefined): string {
  return (raw?.trim() || "https://app.sirrelay.com").replace(/\/$/, "");
}

export type ApiFail = { ok: false; status: number; error: string };
export type ApiOk<T = object> = { ok: true } & T;

type Json = Record<string, unknown> | null;

async function clientFetch(
  origin: string,
  token: string,
  clientVersion: string,
  path: string,
  init?: { method?: string; body?: unknown },
  fetchImpl: typeof fetch = fetch,
): Promise<{ status: number; json: Json }> {
  const response = await fetchImpl(`${origin}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "X-SirRelay-Client": `mcp/${clientVersion}`,
      ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const json = (await response.json().catch(() => null)) as Json;
  return { status: response.status, json };
}

function mapError(status: number, json: Json): ApiFail {
  const error = typeof json?.error === "string" ? json.error : "failed";
  const message = typeof json?.message === "string" ? json.message.trim() : "";
  if (status === 410 || error === "upgrade_required") {
    return { ok: false, status, error: message || UPGRADE_MCP_MESSAGE };
  }
  return { ok: false, status, error: message || error };
}

export type BoardTask = {
  id: string;
  title: string;
  status: string;
  projectId: string | null;
  acronym: string;
  due: string | null;
  difficulty: string;
  description: string;
};

export type BoardSnapshot = {
  userId: string;
  groupId: string | null;
  groupName: string;
  groups: { id: string; name: string }[];
  projects: { id: string; acronym: string; name: string }[];
  tasks: BoardTask[];
};

export async function listBoard(
  origin: string,
  token: string,
  groupId: string | undefined,
  clientVersion: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ApiOk<{ board: BoardSnapshot }> | ApiFail> {
  let q = "";
  if (groupId?.trim()) {
    try {
      q = `?groupId=${encodeURIComponent(assertSafeId(groupId, "groupId"))}`;
    } catch (err) {
      return { ok: false, status: 400, error: err instanceof Error ? err.message : "invalid" };
    }
  }
  const { status, json } = await clientFetch(
    origin,
    token,
    clientVersion,
    `/api/v1/client/board${q}`,
    undefined,
    fetchImpl,
  );
  if (status !== 200 || !json || typeof json !== "object") {
    return mapError(status, json);
  }
  const tasks = Array.isArray(json.tasks) ? json.tasks : [];
  return {
    ok: true,
    board: {
      userId: String(json.userId ?? ""),
      groupId: json.groupId == null ? null : String(json.groupId),
      groupName: String(json.groupName ?? ""),
      groups: Array.isArray(json.groups)
        ? json.groups.map((g) => {
            const row = g as { id?: string; name?: string };
            return { id: String(row.id ?? ""), name: String(row.name ?? "") };
          })
        : [],
      projects: Array.isArray(json.projects)
        ? json.projects.map((p) => {
            const row = p as { id?: string; acronym?: string; name?: string };
            return {
              id: String(row.id ?? ""),
              acronym: String(row.acronym ?? ""),
              name: String(row.name ?? ""),
            };
          })
        : [],
      tasks: tasks.map((t) => {
        const row = t as Record<string, unknown>;
        return {
          id: String(row.id ?? ""),
          title: String(row.title ?? ""),
          status: String(row.status ?? ""),
          projectId: row.projectId == null ? null : String(row.projectId),
          acronym: String(row.acronym ?? ""),
          due: row.due == null ? null : String(row.due),
          difficulty: String(row.difficulty ?? ""),
          description: String(row.description ?? "").slice(0, 500),
        };
      }),
    },
  };
}

export type CreateTaskArgs = {
  title: string;
  description?: string;
  dueDate?: string;
  projectId?: string;
  groupId?: string;
  assigneeId?: string;
  difficulty?: string;
  status?: "todo" | "doing" | "done";
};

export function buildCreateBody(args: CreateTaskArgs): Record<string, string> {
  const body: Record<string, string> = { title: args.title.trim() };
  if (args.description !== undefined) {
    body.description = args.description.slice(0, 10_000);
  }
  if (args.dueDate?.trim()) body.dueDate = args.dueDate.trim();
  if (args.projectId?.trim()) body.projectId = assertSafeId(args.projectId, "projectId");
  if (args.groupId?.trim()) body.groupId = assertSafeId(args.groupId, "groupId");
  if (args.assigneeId?.trim()) body.assigneeId = assertSafeId(args.assigneeId, "assigneeId");
  if (args.difficulty?.trim()) body.difficulty = args.difficulty.trim().slice(0, 32);
  return body;
}

export async function createTask(
  origin: string,
  token: string,
  args: CreateTaskArgs,
  clientVersion: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ApiOk<{ id?: string; away: boolean; assigneeName?: string }> | ApiFail> {
  const title = args.title.trim();
  if (!title) return { ok: false, status: 400, error: "title" };
  if (title.length > 200) return { ok: false, status: 400, error: "title_too_long" };

  let body: Record<string, string>;
  try {
    body = buildCreateBody({ ...args, title });
  } catch (err) {
    return { ok: false, status: 400, error: err instanceof Error ? err.message : "invalid" };
  }

  const { status, json } = await clientFetch(
    origin,
    token,
    clientVersion,
    "/api/v1/client/tasks",
    { method: "POST", body },
    fetchImpl,
  );
  if (status !== 200 || !json?.ok) return mapError(status, json);

  const id = typeof json.id === "string" ? json.id : undefined;
  const away = Boolean(json.away);
  const assigneeName =
    typeof json.assigneeName === "string" ? json.assigneeName : undefined;

  if (args.status && args.status !== "todo" && id) {
    const moved = await updateTask(
      origin,
      token,
      { taskId: id, groupId: args.groupId, status: args.status },
      clientVersion,
      fetchImpl,
    );
    if (!moved.ok) return moved;
  }

  return { ok: true, id, away, assigneeName };
}

export type UpdateTaskArgs = {
  taskId: string;
  groupId?: string;
  status?: "todo" | "doing" | "done";
  title?: string;
  /** Pass "" to clear project. */
  projectId?: string;
};

export async function updateTask(
  origin: string,
  token: string,
  args: UpdateTaskArgs,
  clientVersion: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ApiOk | ApiFail> {
  let taskId: string;
  let groupId: string | undefined;
  try {
    taskId = assertSafeId(args.taskId, "taskId");
    if (args.groupId?.trim()) groupId = assertSafeId(args.groupId, "groupId");
  } catch (err) {
    return { ok: false, status: 400, error: err instanceof Error ? err.message : "invalid" };
  }

  const ops: Record<string, unknown>[] = [];
  if (args.title !== undefined) {
    const title = args.title.trim();
    if (!title) return { ok: false, status: 400, error: "title" };
    ops.push({ op: "title", title: title.slice(0, 200) });
  }
  if (args.projectId !== undefined) {
    if (args.projectId === "") {
      ops.push({ op: "project", projectId: null });
    } else {
      try {
        ops.push({
          op: "project",
          projectId: assertSafeId(args.projectId, "projectId"),
        });
      } catch (err) {
        return {
          ok: false,
          status: 400,
          error: err instanceof Error ? err.message : "invalid",
        };
      }
    }
  }
  if (args.status !== undefined) {
    ops.push({ op: "status", status: args.status });
  }
  if (ops.length === 0) return { ok: false, status: 400, error: "no_changes" };

  for (const op of ops) {
    const { status, json } = await clientFetch(
      origin,
      token,
      clientVersion,
      `/api/v1/client/tasks/${encodeURIComponent(taskId)}`,
      { method: "PATCH", body: { ...op, ...(groupId ? { groupId } : {}) } },
      fetchImpl,
    );
    if (status !== 200 || !json?.ok) return mapError(status, json);
  }
  return { ok: true };
}

export async function deleteTask(
  origin: string,
  token: string,
  args: { taskId: string; groupId?: string; confirm: boolean },
  clientVersion: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ApiOk | ApiFail> {
  if (args.confirm !== true) {
    return { ok: false, status: 400, error: "confirm_required" };
  }
  let taskId: string;
  let groupId: string | undefined;
  try {
    taskId = assertSafeId(args.taskId, "taskId");
    if (args.groupId?.trim()) groupId = assertSafeId(args.groupId, "groupId");
  } catch (err) {
    return { ok: false, status: 400, error: err instanceof Error ? err.message : "invalid" };
  }

  const { status, json } = await clientFetch(
    origin,
    token,
    clientVersion,
    `/api/v1/client/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "PATCH",
      body: { op: "delete", ...(groupId ? { groupId } : {}) },
    },
    fetchImpl,
  );
  if (status !== 200 || !json?.ok) return mapError(status, json);
  return { ok: true };
}

export function formatBoardText(board: BoardSnapshot): string {
  const lines: string[] = [
    `Group: ${board.groupName || "(none)"} (${board.groupId ?? "—"})`,
    `Groups: ${board.groups.map((g) => `${g.name} [${g.id}]`).join("; ") || "—"}`,
    `Projects: ${board.projects.map((p) => `${p.acronym || "?"} ${p.name} [${p.id}]`).join("; ") || "—"}`,
    "Tasks (yours only):",
  ];
  if (board.tasks.length === 0) {
    lines.push("  (none)");
  } else {
    for (const t of board.tasks) {
      const proj = t.acronym ? ` #${t.acronym}` : "";
      const due = t.due ? ` due=${t.due}` : "";
      lines.push(`  [${t.status}] ${t.id} — ${t.title}${proj}${due}`);
    }
  }
  return lines.join("\n");
}
