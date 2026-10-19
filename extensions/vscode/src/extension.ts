import * as vscode from "vscode";
import { appOrigin, sirFetch, type Board } from "./sirrelay";

const SECRET = "sirrelay.token";
const GROUP = "sirrelay.groupId";

type WebviewMessage =
  | { type: "ready" }
  | { type: "sign-in" }
  | { type: "open-site" }
  | { type: "open-task"; id: string }
  | { type: "clone"; id: string }
  | { type: "delete"; id: string }
  | { type: "sign-out" }
  | { type: "paste"; token: string }
  | { type: "clip" }
  | { type: "select-group"; groupId: string }
  | { type: "create"; fields: Record<string, string> }
  | { type: "move"; id: string; status: "doing" | "done" }
  | { type: "title"; id: string; title: string }
  | { type: "nudge"; id: string };

let panel: vscode.Webview | undefined;
let boardView: vscode.WebviewView | undefined;
let statusItem: vscode.StatusBarItem | undefined;
let pendingNotice = "";

export function activate(context: vscode.ExtensionContext): void {
  statusItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  statusItem.command = "sirrelay.board.focus";
  context.subscriptions.push(
    statusItem,
    vscode.window.registerWebviewViewProvider(
      "sirrelay.board",
      new BoardViewProvider(context),
    ),
    vscode.commands.registerCommand("sirrelay.refresh", () =>
      publish(context, {}),
    ),
    vscode.commands.registerCommand("sirrelay.openSite", () =>
      openOnSrelay(context),
    ),
    vscode.commands.registerCommand("sirrelay.signOut", () => signOut(context)),
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
    boardView = webviewView;
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
      if (boardView === webviewView) boardView = undefined;
    });
    webview.html = boardHtml(webview, this.context.extensionUri);
  }
}

async function openOnSrelay(
  context: vscode.ExtensionContext,
  taskId?: string,
): Promise<void> {
  if (taskId) {
    await vscode.env.openExternal(
      vscode.Uri.parse(
        `${appOrigin()}/en-gb/tasks/${encodeURIComponent(taskId)}?scope=mine&view=board`,
      ),
    );
    return;
  }
  const token = await context.secrets.get(SECRET);
  if (token) {
    await vscode.env.openExternal(
      vscode.Uri.parse(`${appOrigin()}/en-gb/tasks?scope=mine&view=board`),
    );
    return;
  }
  const scheme = vscode.env.uriScheme === "cursor" ? "cursor" : "vscode";
  const next = `/en-gb/vscode/connect?scheme=${scheme}`;
  await vscode.env.openExternal(
    vscode.Uri.parse(`${appOrigin()}/en-gb?next=${encodeURIComponent(next)}`),
  );
}

function toast(
  context: vscode.ExtensionContext,
  opts: { error?: string; notice?: string },
): void {
  if (opts.error) {
    void vscode.window
      .showErrorMessage(opts.error, "Try again")
      .then((pick) => {
        if (pick === "Try again") void publish(context, {});
      });
    return;
  }
  if (opts.notice) void vscode.window.showInformationMessage(opts.notice);
}

async function signOut(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(SECRET);
  await publish(context, {});
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
    await openOnSrelay(context);
    return;
  }
  if (message.type === "open-task") {
    await openOnSrelay(context, message.id);
    return;
  }
  if (message.type === "clone" || message.type === "delete") {
    const token = await context.secrets.get(SECRET);
    const groupId = context.globalState.get<string>(GROUP) ?? "";
    if (!token) {
      await publish(context, {});
      return;
    }
    if (message.type === "delete") {
      const pick = await vscode.window.showWarningMessage(
        "Delete this task permanently? This cannot be undone.",
        { modal: true },
        "Delete",
      );
      if (pick !== "Delete") {
        await publish(context, {});
        return;
      }
    }
    await mutate(context, token, groupId, message.id, { op: message.type });
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
    await signOut(context);
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

function updateChrome(signedIn: boolean, board: Board | null): void {
  void vscode.commands.executeCommand("setContext", "sirrelay.signedIn", signedIn);
  if (!signedIn) {
    if (boardView) boardView.badge = undefined;
    statusItem?.hide();
    return;
  }
  if (!board) return;

  const todo = board.tasks.filter((task) => task.status === "todo").length;
  if (boardView) {
    boardView.badge =
      todo > 0 ? { value: todo, tooltip: `${todo} to do` } : undefined;
  }

  const doing = board.tasks
    .filter((task) => task.status === "doing")
    .sort((a, b) => a.order - b.order)[0];
  if (!statusItem) return;
  if (!doing) {
    statusItem.hide();
    return;
  }
  const label =
    doing.title.length > 40 ? `${doing.title.slice(0, 37)}…` : doing.title;
  statusItem.text = `$(play) SRelay: ${label}`;
  statusItem.tooltip = doing.title;
  statusItem.show();
}

async function publish(
  context: vscode.ExtensionContext,
  extra: { error?: string; notice?: string; created?: boolean },
): Promise<void> {
  const notice = extra.notice || pendingNotice;
  const token = await context.secrets.get(SECRET);
  if (!token) {
    updateChrome(false, null);
    const error = extra.error ?? "";
    toast(context, { error, notice: error ? undefined : notice });
    post({
      type: "state",
      signedIn: false,
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
    updateChrome(true, null);
    toast(context, { error: extra.error || offline() });
    post({
      type: "state",
      signedIn: true,
      board: null,
      created: false,
    });
    return;
  }
  if (response.status === 401) {
    await context.secrets.delete(SECRET);
    updateChrome(false, null);
    toast(context, { error: "The code expired. Sign in again." });
    post({
      type: "state",
      signedIn: false,
      board: null,
      created: false,
    });
    return;
  }
  if (!response.ok) {
    updateChrome(true, null);
    toast(context, { error: extra.error || offline() });
    post({
      type: "state",
      signedIn: true,
      board: null,
      created: false,
    });
    return;
  }
  const board = (await response.json()) as Board;
  if (board.groupId) await context.globalState.update(GROUP, board.groupId);
  updateChrome(true, board);
  if (extra.error) toast(context, { error: extra.error });
  else if (notice) toast(context, { notice });
  post({
    type: "state",
    signedIn: true,
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
