#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  appOrigin,
  createTask,
  deleteTask,
  formatBoardText,
  listBoard,
  updateTask,
} from "./client-api.js";

function packageVersion(): string {
  try {
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function toolError(status: number, error: string) {
  const hint =
    status === 401
      ? "Token rejected — open SirRelay → Profile → Editor & MCP key (or /connect) for a new key."
      : error;
  return {
    content: [{ type: "text" as const, text: `Error (${status}): ${hint}` }],
    isError: true as const,
  };
}

const version = packageVersion();
const token = process.env.SIRRELAY_TOKEN?.trim() ?? "";
const origin = appOrigin(process.env.SIRRELAY_URL);

if (!token) {
  console.error(
    "sirrelay-mcp: set SIRRELAY_TOKEN (from SirRelay → Profile → Editor & MCP key).",
  );
  process.exit(1);
}

const statusEnum = z.enum(["todo", "doing", "done"]);

const server = new McpServer({
  name: "sirrelay",
  version,
});

server.registerTool(
  "list_tasks",
  {
    description:
      "Read the signed-in user's SRelay board (own tasks only). Optional groupId switches group.",
    inputSchema: {
      groupId: z
        .string()
        .optional()
        .describe("Optional group id (defaults to the user's active group)"),
    },
  },
  async (args) => {
    const result = await listBoard(origin, token, args.groupId, version);
    if (!result.ok) return toolError(result.status, result.error);
    return { content: [{ type: "text", text: formatBoardText(result.board) }] };
  },
);

server.registerTool(
  "create_task",
  {
    description:
      "Create a task on the signed-in user's board. Defaults to status todo; pass status to place it after create. Authz is enforced by the server.",
    inputSchema: {
      title: z.string().min(1).max(200).describe("Task title"),
      description: z.string().max(10_000).optional().describe("Optional description"),
      dueDate: z.string().optional().describe("Optional due date (YYYY-MM-DD)"),
      projectId: z.string().optional().describe("Optional project id"),
      groupId: z.string().optional().describe("Optional group id"),
      assigneeId: z
        .string()
        .optional()
        .describe("Optional assignee user id (defaults to self; server enforces permissions)"),
      difficulty: z.string().max(32).optional().describe("Optional difficulty"),
      status: statusEnum
        .optional()
        .describe("Optional status after create (todo|doing|done)"),
    },
  },
  async (args) => {
    const result = await createTask(origin, token, args, version);
    if (!result.ok) return toolError(result.status, result.error);
    const bits = ["Task created."];
    if (result.id) bits.push(`id=${result.id}`);
    if (args.status && args.status !== "todo") bits.push(`status=${args.status}`);
    if (result.away) {
      bits.push(`Assigned to ${result.assigneeName ?? "someone else"} (their column).`);
    }
    return { content: [{ type: "text", text: bits.join(" ") }] };
  },
);

server.registerTool(
  "update_task",
  {
    description:
      "Modify one of your tasks: status (todo|doing|done), title, and/or projectId (empty string clears project). Server enforces permissions.",
    inputSchema: {
      taskId: z.string().min(1).describe("Task id from list_tasks"),
      groupId: z.string().optional().describe("Optional group id"),
      status: statusEnum.optional().describe("New status"),
      title: z.string().min(1).max(200).optional().describe("New title"),
      projectId: z
        .string()
        .optional()
        .describe("Project id, or empty string to clear"),
    },
  },
  async (args) => {
    if (
      args.status === undefined &&
      args.title === undefined &&
      args.projectId === undefined
    ) {
      return toolError(400, "no_changes");
    }
    const result = await updateTask(origin, token, args, version);
    if (!result.ok) return toolError(result.status, result.error);
    return { content: [{ type: "text", text: `Task ${args.taskId} updated.` }] };
  },
);

server.registerTool(
  "delete_task",
  {
    description:
      "Permanently delete a task. Requires confirm=true. Irreversible. Server enforces permissions.",
    inputSchema: {
      taskId: z.string().min(1).describe("Task id from list_tasks"),
      groupId: z.string().optional().describe("Optional group id"),
      confirm: z
        .literal(true)
        .describe("Must be true to delete — prevents accidental deletes"),
    },
  },
  async (args) => {
    const result = await deleteTask(origin, token, args, version);
    if (!result.ok) return toolError(result.status, result.error);
    return { content: [{ type: "text", text: `Task ${args.taskId} deleted.` }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
