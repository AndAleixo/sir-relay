import * as vscode from "vscode";

export type Board = {
  userId: string;
  role: "operator" | "teammate";
  groups: { id: string; name: string }[];
  groupId: string | null;
  groupName: string;
  projects: { id: string; acronym: string; name: string }[];
  members: { id: string; label: string }[];
  tasks: {
    id: string;
    title: string;
    projectId: string | null;
    acronym: string;
    description: string;
    due: string | null;
    difficulty: string;
    status: "todo" | "doing" | "done";
    order: number;
  }[];
};

export { taskMatchesProject } from "./project-filter";

let clientVersion = "0.0.0";

/** Call from activate with `context.extension.packageJSON.version`. */
export function setClientVersion(version: string): void {
  const trimmed = version.trim();
  if (trimmed) clientVersion = trimmed;
}

export function appOrigin(): string {
  const raw =
    vscode.workspace.getConfiguration("sirrelay").get<string>("url") ??
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export async function sirFetch(
  token: string,
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<Response> {
  return fetch(`${appOrigin()}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "X-SirRelay-Client": `extension/${clientVersion}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
}
