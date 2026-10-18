/**
 * Tasks list URL: ?scope=mine|team&view=board|list&project=<id> (+ one-shot success flash).
 * Defaults: operator → team, teammate → mine; view → board; omit project = All (board + list).
 */
export type TasksScope = "mine" | "team";
export type TasksView = "board" | "list";

export type TasksListFlash = {
  saved?: boolean;
  deleted?: boolean;
  error?: string;
};

export type TasksHrefOpts = {
  scope: TasksScope;
  view: TasksView;
  /** Open project id, or omit/null = All. */
  project?: string | null;
};

function setProjectParam(
  params: URLSearchParams,
  project?: string | null,
): void {
  if (project) params.set("project", project);
}

export function parseTasksScope(
  raw: string | undefined,
  role: "operator" | "teammate",
): TasksScope {
  if (raw === "mine" || raw === "team") return raw;
  return role === "operator" ? "team" : "mine";
}

export function parseTasksView(raw: string | undefined): TasksView {
  return raw === "list" ? "list" : "board";
}

/** Keep `?project=` only when it matches an open project; else All. */
export function parseTasksProject(
  raw: string | undefined,
  openIds: readonly string[],
): string | null {
  const id = raw?.trim() ?? "";
  if (!id) return null;
  return openIds.includes(id) ? id : null;
}

/** Coerce form/query return fields without a role default (falls back to team/board). */
export function coerceTasksScope(raw: string | undefined): TasksScope {
  return raw === "mine" || raw === "team" ? raw : "team";
}

export function coerceTasksView(raw: string | undefined): TasksView {
  return raw === "list" ? "list" : "board";
}

export function coerceTasksProject(raw: string | undefined): string | undefined {
  const id = raw?.trim();
  return id || undefined;
}

export function tasksListHref(
  locale: string,
  opts: TasksHrefOpts & TasksListFlash,
): string {
  const params = new URLSearchParams();
  params.set("scope", opts.scope);
  params.set("view", opts.view);
  setProjectParam(params, opts.project);
  if (opts.saved) params.set("saved", "1");
  if (opts.deleted) params.set("deleted", "1");
  if (opts.error) params.set("error", opts.error);
  return `/${locale}/tasks?${params.toString()}`;
}

export function taskDetailHref(
  locale: string,
  taskId: string,
  opts: TasksHrefOpts & {
    renotify?: boolean;
    error?: string;
  },
): string {
  const params = new URLSearchParams();
  params.set("scope", opts.scope);
  params.set("view", opts.view);
  setProjectParam(params, opts.project);
  if (opts.renotify) params.set("renotify", "1");
  if (opts.error) params.set("error", opts.error);
  return `/${locale}/tasks/${taskId}?${params.toString()}`;
}

export function taskNewHref(
  locale: string,
  opts: TasksHrefOpts & { error?: string },
): string {
  const params = new URLSearchParams();
  params.set("scope", opts.scope);
  params.set("view", opts.view);
  setProjectParam(params, opts.project);
  if (opts.error) params.set("error", opts.error);
  return `/${locale}/tasks/new?${params.toString()}`;
}

/** Read return scope/view/project from form fields (or args); fall back by role. */
export function tasksListHrefFromReturn(
  locale: string,
  role: "operator" | "teammate",
  returnScope: string | undefined,
  returnView: string | undefined,
  flash?: TasksListFlash,
  returnProject?: string | undefined,
): string {
  return tasksListHref(locale, {
    scope: parseTasksScope(returnScope, role),
    view: parseTasksView(returnView),
    project: coerceTasksProject(returnProject) ?? null,
    ...flash,
  });
}
