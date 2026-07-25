/**
 * Tasks list URL: ?scope=mine|team&view=board|list (+ flash banners).
 * Defaults: operator → team, teammate → mine; view → board.
 */
export type TasksScope = "mine" | "team";
export type TasksView = "board" | "list";

export type TasksListFlash = {
  saved?: boolean;
  deleted?: boolean;
  error?: string;
};

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

/** Coerce form/query return fields without a role default (falls back to team/board). */
export function coerceTasksScope(raw: string | undefined): TasksScope {
  return raw === "mine" || raw === "team" ? raw : "team";
}

export function coerceTasksView(raw: string | undefined): TasksView {
  return raw === "list" ? "list" : "board";
}

export function tasksListHref(
  locale: string,
  opts: {
    scope: TasksScope;
    view: TasksView;
  } & TasksListFlash,
): string {
  const params = new URLSearchParams();
  params.set("scope", opts.scope);
  params.set("view", opts.view);
  if (opts.saved) params.set("saved", "1");
  if (opts.deleted) params.set("deleted", "1");
  if (opts.error) params.set("error", opts.error);
  return `/${locale}/tasks?${params.toString()}`;
}

export function taskDetailHref(
  locale: string,
  taskId: string,
  opts: {
    scope: TasksScope;
    view: TasksView;
    renotify?: boolean;
    error?: string;
  },
): string {
  const params = new URLSearchParams();
  params.set("scope", opts.scope);
  params.set("view", opts.view);
  if (opts.renotify) params.set("renotify", "1");
  if (opts.error) params.set("error", opts.error);
  return `/${locale}/tasks/${taskId}?${params.toString()}`;
}

export function taskNewHref(
  locale: string,
  opts: { scope: TasksScope; view: TasksView; error?: string },
): string {
  const params = new URLSearchParams();
  params.set("scope", opts.scope);
  params.set("view", opts.view);
  if (opts.error) params.set("error", opts.error);
  return `/${locale}/tasks/new?${params.toString()}`;
}

/** Read return scope/view from form fields (or args); fall back by role. */
export function tasksListHrefFromReturn(
  locale: string,
  role: "operator" | "teammate",
  returnScope: string | undefined,
  returnView: string | undefined,
  flash?: TasksListFlash,
): string {
  return tasksListHref(locale, {
    scope: parseTasksScope(returnScope, role),
    view: parseTasksView(returnView),
    ...flash,
  });
}
