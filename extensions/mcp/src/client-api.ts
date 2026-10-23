/** Shared HTTPS client for /api/v1/client/* — origin/token only from process env (no tool SSRF). */

export const UPGRADE_MCP_MESSAGE =
  "This SRelay MCP is out of date. Update it.";

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

export type BoardCategory = { id: string; name: string };

export type BoardTask = {
  id: string;
  title: string;
  status: string;
  projectId: string | null;
  acronym: string;
  categoryId: string | null;
  categoryName: string;
  due: string | null;
  difficulty: string;
  description: string;
};

export type BoardSnapshot = {
  userId: string;
  groupId: string | null;
  groupName: string;
  groups: { id: string; name: string }[];
  projects: {
    id: string;
    acronym: string;
    name: string;
    categories: BoardCategory[];
  }[];
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
            const row = p as {
              id?: string;
              acronym?: string;
              name?: string;
              categories?: { id?: string; name?: string }[];
            };
            return {
              id: String(row.id ?? ""),
              acronym: String(row.acronym ?? ""),
              name: String(row.name ?? ""),
              categories: Array.isArray(row.categories)
                ? row.categories.map((c) => ({
                    id: String(c.id ?? ""),
                    name: String(c.name ?? ""),
                  }))
                : [],
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
          categoryId: row.categoryId == null ? null : String(row.categoryId),
          categoryName: String(row.categoryName ?? ""),
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
  categoryId?: string;
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
  if (args.categoryId?.trim()) {
    body.categoryId = assertSafeId(args.categoryId, "categoryId");
  }
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
    const moved = await patchTask(
      origin,
      token,
      { taskId: id, groupId: args.groupId, op: "status", status: args.status },
      clientVersion,
      fetchImpl,
    );
    if (!moved.ok) return moved;
  }

  return { ok: true, id, away, assigneeName };
}

export type PatchTaskArgs =
  | {
      taskId: string;
      groupId?: string;
      op: "status";
      status: "todo" | "doing" | "done";
    }
  | { taskId: string; groupId?: string; op: "title"; title: string }
  | { taskId: string; groupId?: string; op: "description"; description: string }
  | {
      taskId: string;
      groupId?: string;
      op: "dueDate";
      /** Pass "" or null to clear. */
      dueDate: string | null;
    }
  | {
      taskId: string;
      groupId?: string;
      op: "difficulty";
      /** Pass "" or null to clear. */
      difficulty: "easy" | "medium" | "hard" | "" | null;
    }
  | {
      taskId: string;
      groupId?: string;
      op: "project";
      /** Pass "" or null to clear. */
      projectId: string | null;
    }
  | {
      taskId: string;
      groupId?: string;
      op: "category";
      /** Pass "" or null to clear. Requires a project on the task. */
      categoryId: string | null;
    }
  | { taskId: string; groupId?: string; op: "clone" }
  | { taskId: string; groupId?: string; op: "delete" };

function buildPatchBody(args: PatchTaskArgs): Record<string, unknown> {
  switch (args.op) {
    case "status":
      return { op: "status", status: args.status };
    case "title": {
      const title = args.title.trim();
      if (!title) throw new Error("title");
      return { op: "title", title: title.slice(0, 200) };
    }
    case "description":
      return { op: "description", description: args.description.slice(0, 10_000) };
    case "dueDate":
      return {
        op: "dueDate",
        dueDate: args.dueDate == null || args.dueDate === "" ? null : args.dueDate.trim(),
      };
    case "difficulty":
      return {
        op: "difficulty",
        difficulty:
          args.difficulty == null || args.difficulty === "" ? null : args.difficulty,
      };
    case "project":
      return {
        op: "project",
        projectId:
          args.projectId == null || args.projectId === ""
            ? null
            : assertSafeId(args.projectId, "projectId"),
      };
    case "category":
      return {
        op: "category",
        categoryId:
          args.categoryId == null || args.categoryId === ""
            ? null
            : assertSafeId(args.categoryId, "categoryId"),
      };
    case "clone":
      return { op: "clone" };
    case "delete":
      return { op: "delete" };
  }
}

export async function patchTask(
  origin: string,
  token: string,
  args: PatchTaskArgs,
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

  let body: Record<string, unknown>;
  try {
    body = buildPatchBody(args);
  } catch (err) {
    return { ok: false, status: 400, error: err instanceof Error ? err.message : "invalid" };
  }

  const { status, json } = await clientFetch(
    origin,
    token,
    clientVersion,
    `/api/v1/client/tasks/${encodeURIComponent(taskId)}`,
    { method: "PATCH", body: { ...body, ...(groupId ? { groupId } : {}) } },
    fetchImpl,
  );
  if (status !== 200 || !json?.ok) return mapError(status, json);
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
  return patchTask(
    origin,
    token,
    { taskId: args.taskId, groupId: args.groupId, op: "delete" },
    clientVersion,
    fetchImpl,
  );
}

export function formatBoardText(board: BoardSnapshot): string {
  const lines: string[] = [
    `Group: ${board.groupName || "(none)"} (${board.groupId ?? "—"})`,
    `Groups: ${board.groups.map((g) => `${g.name} [${g.id}]`).join("; ") || "—"}`,
    `Projects: ${
      board.projects
        .map((p) => {
          const cats =
            p.categories.length > 0
              ? ` cats=${p.categories.map((c) => `${c.name}[${c.id}]`).join(",")}`
              : "";
          return `${p.acronym || "?"} ${p.name} [${p.id}]${cats}`;
        })
        .join("; ") || "—"
    }`,
    "Tasks (yours only):",
  ];
  if (board.tasks.length === 0) {
    lines.push("  (none)");
  } else {
    for (const t of board.tasks) {
      const proj = t.acronym ? ` #${t.acronym}` : "";
      const cat = t.categoryName ? ` cat=${t.categoryName}` : "";
      const due = t.due ? ` due=${t.due}` : "";
      const diff = t.difficulty ? ` diff=${t.difficulty}` : "";
      lines.push(`  [${t.status}] ${t.id} — ${t.title}${proj}${cat}${due}${diff}`);
    }
  }
  return lines.join("\n");
}
