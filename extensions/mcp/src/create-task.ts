/**
 * Body for POST /api/v1/client/tasks.
 * Shared HTTP API (Bearer link token). Independent of the VS Code extension —
 * extension and this MCP are separate clients of the same endpoint.
 */
export type CreateTaskArgs = {
  title: string;
  description?: string;
  dueDate?: string;
  projectId?: string;
  groupId?: string;
  assigneeId?: string;
  difficulty?: string;
};

export type CreateTaskResult =
  | { ok: true; away: boolean; assigneeName?: string }
  | { ok: false; status: number; error: string };

/** Fallback when the server omits `message` on upgrade_required. */
export const UPGRADE_MCP_MESSAGE =
  "This SRelay MCP is out of date. Update @sirrelay/mcp to the latest version, then link again at /connect.";

export function appOrigin(raw: string | undefined): string {
  const base = (raw?.trim() || "https://app.sirrelay.com").replace(/\/$/, "");
  return base;
}

export function buildRequestBody(args: CreateTaskArgs): Record<string, string> {
  const body: Record<string, string> = {
    title: args.title.trim(),
  };
  if (args.description !== undefined) body.description = args.description;
  if (args.dueDate?.trim()) body.dueDate = args.dueDate.trim();
  if (args.projectId?.trim()) body.projectId = args.projectId.trim();
  if (args.groupId?.trim()) body.groupId = args.groupId.trim();
  if (args.assigneeId?.trim()) body.assigneeId = args.assigneeId.trim();
  if (args.difficulty?.trim()) body.difficulty = args.difficulty.trim();
  return body;
}

export async function createTask(
  origin: string,
  token: string,
  args: CreateTaskArgs,
  fetchImpl: typeof fetch = fetch,
  clientVersion = "0.0.0",
): Promise<CreateTaskResult> {
  const title = args.title.trim();
  if (!title) return { ok: false, status: 400, error: "title" };

  const response = await fetchImpl(`${origin}/api/v1/client/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-SirRelay-Client": `mcp/${clientVersion}`,
    },
    body: JSON.stringify(buildRequestBody({ ...args, title })),
  });

  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    message?: string;
    away?: boolean;
    assigneeName?: string;
  } | null;

  if (!response.ok) {
    const upgrade =
      response.status === 410 || payload?.error === "upgrade_required";
    return {
      ok: false,
      status: response.status,
      error: upgrade
        ? payload?.message?.trim() || UPGRADE_MCP_MESSAGE
        : (payload?.error ?? "failed"),
    };
  }

  return {
    ok: true,
    away: Boolean(payload?.away),
    assigneeName: payload?.assigneeName,
  };
}
