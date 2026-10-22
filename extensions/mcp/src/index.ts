#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { appOrigin, createTask } from "./create-task.js";

function packageVersion(): string {
  try {
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const version = packageVersion();
const token = process.env.SIRRELAY_TOKEN?.trim() ?? "";
const origin = appOrigin(process.env.SIRRELAY_URL);

if (!token) {
  console.error(
    "sirrelay-mcp: set SIRRELAY_TOKEN (code from SirRelay → Link this editor → /connect).",
  );
  process.exit(1);
}

const server = new McpServer({
  name: "sirrelay",
  version,
});

server.registerTool(
  "create_task",
  {
    description:
      "Create a task on the signed-in user's SRelay board. Uses the active group unless groupId is set.",
    inputSchema: {
      title: z.string().min(1).describe("Task title"),
      description: z.string().optional().describe("Optional description"),
      dueDate: z
        .string()
        .optional()
        .describe("Optional due date (YYYY-MM-DD)"),
      projectId: z.string().optional().describe("Optional project id"),
      groupId: z
        .string()
        .optional()
        .describe("Optional group id (defaults to the user's active group)"),
      assigneeId: z
        .string()
        .optional()
        .describe("Optional assignee user id (defaults to self)"),
      difficulty: z.string().optional().describe("Optional difficulty"),
    },
  },
  async (args) => {
    const result = await createTask(origin, token, args, fetch, version);
    if (!result.ok) {
      const hint =
        result.status === 401
          ? "Token rejected — open SirRelay → Link this editor (/connect) for a new code."
          : result.error;
      return {
        content: [
          {
            type: "text",
            text: `Could not create task (${result.status}): ${hint}`,
          },
        ],
        isError: true,
      };
    }
    const note = result.away
      ? ` Assigned to ${result.assigneeName ?? "someone else"} (their column).`
      : "";
    return {
      content: [{ type: "text", text: `Task created.${note}` }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
