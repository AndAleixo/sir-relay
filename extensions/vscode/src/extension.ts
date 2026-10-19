import * as vscode from "vscode";
import { appOrigin, sirFetch, type Board } from "./sirrelay";

const SECRET = "sirrelay.token";
const GROUP = "sirrelay.groupId";

type WebviewMessage =
  | { type: "ready" }
  | { type: "sign-in" }
  | { type: "open-site" }
  | { type: "sign-out" }
  | { type: "paste"; token: string }
  | { type: "clip" }
  | { type: "select-group"; groupId: string }
  | { type: "create"; fields: Record<string, string> }
  | { type: "move"; id: string; status: "doing" | "done" }
  | { type: "title"; id: string; title: string }
  | { type: "nudge"; id: string };

let panel: vscode.Webview | undefined;
let pendingNotice = "";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "sirrelay.board",
      new BoardViewProvider(context),
    ),
    vscode.window.registerUriHandler({
      handleUri(uri) {
        const token = new URLSearchParams(uri.query).get("token");
        if (!token) return;
        pendingNotice = "Account linked.";
        void context.secrets.store(SECRET, token).then(async () => {
          await vscode.commands.executeCommand("sirrelay.board.focus");
          await publish(context, { notice: "Account linked." });
        });
      },
    }),
  );
}

export function deactivate(): void {}

class BoardViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    const webview = webviewView.webview;
    panel = webview;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "media")],
    };
    const subscription = webview.onDidReceiveMessage((message: WebviewMessage) => {
      void onMessage(this.context, message);
    });
    webviewView.onDidDispose(() => {
      subscription.dispose();
      if (panel === webview) panel = undefined;
    });
    webview.html = boardHtml(webview, this.context.extensionUri);
  }
}

async function onMessage(
  context: vscode.ExtensionContext,
  message: WebviewMessage,
): Promise<void> {
  if (message.type === "ready") {
    await publish(context, { notice: pendingNotice });
    return;
  }
  if (message.type === "open-site") {
    const scheme = vscode.env.uriScheme === "cursor" ? "cursor" : "vscode";
    const next = `/en-gb/vscode/connect?scheme=${scheme}`;
    await vscode.env.openExternal(
      vscode.Uri.parse(`${appOrigin()}/en-gb?next=${encodeURIComponent(next)}`),
    );
    return;
  }
  if (message.type === "sign-in") {
    const scheme = vscode.env.uriScheme === "cursor" ? "cursor" : "vscode";
    await vscode.env.openExternal(
      vscode.Uri.parse(
        `${appOrigin()}/en-gb/vscode/connect?scheme=${scheme}`,
      ),
    );
    return;
  }
  if (message.type === "sign-out") {
    await context.secrets.delete(SECRET);
    await publish(context, {});
    return;
  }
  if (message.type === "clip") {
    const text = (await vscode.env.clipboard.readText()).trim();
    panel?.postMessage({ type: "clipboard", text });
    return;
  }
  if (message.type === "paste") {
    const token = message.token.trim();
    if (!token) return;
    await context.secrets.store(SECRET, token);
    await publish(context, { notice: "Account linked." });
    return;
  }
  if (message.type === "select-group") {
    await context.globalState.update(GROUP, message.groupId);
    await publish(context, {});
    return;
  }

  const token = await context.secrets.get(SECRET);
  const groupId = context.globalState.get<string>(GROUP) ?? "";
  if (!token) {
    await publish(context, {});
    return;
  }

  if (message.type === "create") {
    const response = await call(token, "/api/v1/vscode/tasks", {
      method: "POST",
      body: { ...message.fields, groupId },
    });
    if (!response) {
      await publish(context, { error: offline() });
      return;
    }
    if (response.status === 401) {
      await context.secrets.delete(SECRET);
      await publish(context, { error: "The code expired. Sign in again." });
      return;
    }
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      away?: boolean;
      assigneeName?: string;
    } | null;
    if (!response.ok) {
      await publish(context, { error: "Could not save the task." });
      return;
    }
    await publish(context, {
      created: true,
      notice: body?.away
        ? `Assigned to ${body.assigneeName ?? "someone else"}. It stays on their column.`
        : "",
    });
    return;
  }

  if (message.type === "move") {
    await mutate(context, token, groupId, message.id, {
      op: "status",
      status: message.status,
    });
    return;
  }
  if (message.type === "title") {
    await mutate(context, token, groupId, message.id, {
      op: "title",
      title: message.title,
    });
    return;
  }
  if (message.type === "nudge") {
    const board = await loadBoard(token, groupId);
    if (!board) {
      await publish(context, { error: offline() });
      return;
    }
    const todo = board.tasks
      .filter((task) => task.status === "todo")
      .sort((a, b) => a.order - b.order);
    const index = todo.findIndex((task) => task.id === message.id);
    if (index <= 0) return;
    const orderedTodoIds = todo.map((task) => task.id);
    const previous = orderedTodoIds[index - 1];
    const current = orderedTodoIds[index];
    if (!previous || !current) return;
    orderedTodoIds[index - 1] = current;
    orderedTodoIds[index] = previous;
    await mutate(context, token, groupId, message.id, {
      op: "reorder",
      orderedTodoIds,
    });
  }
}

async function mutate(
  context: vscode.ExtensionContext,
  token: string,
  groupId: string,
  id: string,
  body: Record<string, unknown>,
): Promise<void> {
  const response = await call(token, `/api/v1/vscode/tasks/${id}`, {
    method: "PATCH",
    body: { ...body, groupId },
  });
  if (!response) {
    await publish(context, { error: offline() });
    return;
  }
  if (response.status === 401) {
    await context.secrets.delete(SECRET);
    await publish(context, { error: "The code expired. Sign in again." });
    return;
  }
  if (!response.ok) {
    await publish(context, { error: "Could not save the task." });
    return;
  }
  await publish(context, {});
}

async function loadBoard(token: string, groupId: string): Promise<Board | null> {
  const response = await call(
    token,
    `/api/v1/vscode/board?groupId=${encodeURIComponent(groupId)}`,
  );
  if (!response?.ok) return null;
  return (await response.json()) as Board;
}

async function call(
  token: string,
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<Response | null> {
  try {
    return await sirFetch(token, path, init);
  } catch {
    return null;
  }
}

function offline(): string {
  return `Could not reach SRelay at ${appOrigin()}.`;
}

async function publish(
  context: vscode.ExtensionContext,
  extra: { error?: string; notice?: string; created?: boolean },
): Promise<void> {
  const notice = extra.notice || pendingNotice;
  const token = await context.secrets.get(SECRET);
  if (!token) {
    post({
      type: "state",
      signedIn: false,
      error: extra.error ?? "",
      notice: "",
      board: null,
      created: false,
    });
    return;
  }
  const groupId = context.globalState.get<string>(GROUP) ?? "";
  const response = await call(
    token,
    `/api/v1/vscode/board?groupId=${encodeURIComponent(groupId)}`,
  );
  if (!response) {
    post({
      type: "state",
      signedIn: true,
      error: extra.error || offline(),
      notice,
      board: null,
      created: false,
    });
    return;
  }
  if (response.status === 401) {
    await context.secrets.delete(SECRET);
    post({
      type: "state",
      signedIn: false,
      error: "The code expired. Sign in again.",
      notice: "",
      board: null,
      created: false,
    });
    return;
  }
  if (!response.ok) {
    post({
      type: "state",
      signedIn: true,
      error: extra.error || offline(),
      notice: "",
      board: null,
      created: false,
    });
    return;
  }
  const board = (await response.json()) as Board;
  if (board.groupId) await context.globalState.update(GROUP, board.groupId);
  post({
    type: "state",
    signedIn: true,
    error: extra.error ?? "",
    notice,
    board,
    created: extra.created === true,
  });
}

function post(message: unknown): void {
  if (!panel) return;
  void panel.postMessage(message);
  pendingNotice = "";
}

function boardHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = String(Date.now());
  const css = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "panel.css"),
  );
  const script = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "panel.js"),
  );
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${css}" />
  <title>SRelay</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${script}"></script>
</body>
</html>`;
}
