#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
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
  patchTask,
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
  const hint = status === 401 ? "Invalid API key." : error;
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
    "sirrelay-mcp: set SIRRELAY_TOKEN (from SirRelay → /connect)."
  );
  process.exit(1);
}

const statusEnum = z.enum(["todo", "doing", "done"]);
const difficultyEnum = z.enum(["easy", "medium", "hard"]);
const taskIdField = z.string().min(1).describe("Task id from list_tasks");
const groupIdField = z
  .string()
  .optional()
  .describe("Optional group id (defaults to the user's active group)");

const server = new McpServer({
  name: "sirrelay",
  version,
});

server.registerTool(
  "list_tasks",
  {
    description:
      "Read the signed-in user's SRelay board (own tasks only). Shows projects with category ids. Optional groupId switches group.",
    inputSchema: {
      groupId: groupIdField,
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
      "Create a full task on the signed-in user's board (title required; optional description, dueDate, project, category, difficulty, assignee, status). Defaults to status todo. Authz is enforced by the server.",
    inputSchema: {
      title: z.string().min(1).max(200).describe("Task title"),
      description: z.string().max(10_000).optional().describe("Optional description"),
      dueDate: z.string().optional().describe("Optional due date (YYYY-MM-DD)"),
      projectId: z.string().optional().describe("Optional project id from list_tasks"),
      categoryId: z
        .string()
        .optional()
        .describe("Optional category id (must belong to the chosen project)"),
      groupId: groupIdField,
      assigneeId: z
        .string()
        .optional()
        .describe("Optional assignee user id (defaults to self; server enforces permissions)"),
      difficulty: difficultyEnum.optional().describe("Optional difficulty"),
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
  "set_task_status",
  {
    description: "Set a task's status to todo, doing, or done. One field only.",
    inputSchema: {
      taskId: taskIdField,
      groupId: groupIdField,
      status: statusEnum.describe("New status"),
    },
  },
  async (args) => {
    const result = await patchTask(
      origin,
      token,
      { taskId: args.taskId, groupId: args.groupId, op: "status", status: args.status },
      version,
    );
    if (!result.ok) return toolError(result.status, result.error);
    return {
      content: [
        { type: "text", text: `Task ${args.taskId} status → ${args.status}.` },
      ],
    };
  },
);

server.registerTool(
  "set_task_title",
  {
    description: "Rename a task. One field only.",
    inputSchema: {
      taskId: taskIdField,
      groupId: groupIdField,
      title: z.string().min(1).max(200).describe("New title"),
    },
  },
  async (args) => {
    const result = await patchTask(
      origin,
      token,
      { taskId: args.taskId, groupId: args.groupId, op: "title", title: args.title },
      version,
    );
    if (!result.ok) return toolError(result.status, result.error);
    return { content: [{ type: "text", text: `Task ${args.taskId} title updated.` }] };
  },
);

server.registerTool(
  "set_task_description",
  {
    description: "Replace a task's description (pass empty string to clear). One field only.",
    inputSchema: {
      taskId: taskIdField,
      groupId: groupIdField,
      description: z.string().max(10_000).describe("New description"),
    },
  },
  async (args) => {
    const result = await patchTask(
      origin,
      token,
      {
        taskId: args.taskId,
        groupId: args.groupId,
        op: "description",
        description: args.description,
      },
      version,
    );
    if (!result.ok) return toolError(result.status, result.error);
    return {
      content: [{ type: "text", text: `Task ${args.taskId} description updated.` }],
    };
  },
);

server.registerTool(
  "set_task_due_date",
  {
    description:
      "Set or clear a task's due date (YYYY-MM-DD). Pass empty string to clear. One field only.",
    inputSchema: {
      taskId: taskIdField,
      groupId: groupIdField,
      dueDate: z
        .string()
        .describe("Due date YYYY-MM-DD, or empty string to clear"),
    },
  },
  async (args) => {
    const result = await patchTask(
      origin,
      token,
      {
        taskId: args.taskId,
        groupId: args.groupId,
        op: "dueDate",
        dueDate: args.dueDate,
      },
      version,
    );
    if (!result.ok) return toolError(result.status, result.error);
    return {
      content: [{ type: "text", text: `Task ${args.taskId} due date updated.` }],
    };
  },
);

server.registerTool(
  "set_task_difficulty",
  {
    description:
      "Set or clear a task's difficulty (easy|medium|hard). Pass empty string to clear. One field only.",
    inputSchema: {
      taskId: taskIdField,
      groupId: groupIdField,
      difficulty: z
        .union([difficultyEnum, z.literal("")])
        .describe("easy|medium|hard, or empty string to clear"),
    },
  },
  async (args) => {
    const result = await patchTask(
      origin,
      token,
      {
        taskId: args.taskId,
        groupId: args.groupId,
        op: "difficulty",
        difficulty: args.difficulty,
      },
      version,
    );
    if (!result.ok) return toolError(result.status, result.error);
    return {
      content: [{ type: "text", text: `Task ${args.taskId} difficulty updated.` }],
    };
  },
);

server.registerTool(
  "set_task_project",
  {
    description:
      "Set or clear a task's project. Pass empty string to clear (also clears category). One field only.",
    inputSchema: {
      taskId: taskIdField,
      groupId: groupIdField,
      projectId: z
        .string()
        .describe("Project id from list_tasks, or empty string to clear"),
    },
  },
  async (args) => {
    const result = await patchTask(
      origin,
      token,
      {
        taskId: args.taskId,
        groupId: args.groupId,
        op: "project",
        projectId: args.projectId,
      },
      version,
    );
    if (!result.ok) return toolError(result.status, result.error);
    return {
      content: [{ type: "text", text: `Task ${args.taskId} project updated.` }],
    };
  },
);

server.registerTool(
  "set_task_category",
  {
    description:
      "Set or clear a task's category (must belong to the task's current project). Pass empty string to clear. One field only.",
    inputSchema: {
      taskId: taskIdField,
      groupId: groupIdField,
      categoryId: z
        .string()
        .describe("Category id from list_tasks, or empty string to clear"),
    },
  },
  async (args) => {
    const result = await patchTask(
      origin,
      token,
      {
        taskId: args.taskId,
        groupId: args.groupId,
        op: "category",
        categoryId: args.categoryId,
      },
      version,
    );
    if (!result.ok) return toolError(result.status, result.error);
    return {
      content: [{ type: "text", text: `Task ${args.taskId} category updated.` }],
    };
  },
);

server.registerTool(
  "clone_task",
  {
    description: "Duplicate a task onto your board (server rules apply).",
    inputSchema: {
      taskId: taskIdField,
      groupId: groupIdField,
    },
  },
  async (args) => {
    const result = await patchTask(
      origin,
      token,
      { taskId: args.taskId, groupId: args.groupId, op: "clone" },
      version,
    );
    if (!result.ok) return toolError(result.status, result.error);
    return { content: [{ type: "text", text: `Task ${args.taskId} cloned.` }] };
  },
);

server.registerTool(
  "delete_task",
  {
    description:
      "Permanently delete a task. Requires confirm=true. Irreversible. Server enforces permissions.",
    inputSchema: {
      taskId: taskIdField,
      groupId: groupIdField,
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
