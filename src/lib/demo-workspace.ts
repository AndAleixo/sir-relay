/**
 * Try-demo workspace. Lives in sessionStorage (this tab only).
 * ponytail: no cross-tab sync; BroadcastChannel if a second tab must follow.
 */
import type {
  Locale,
  ManagedProject,
  OperatorAlert,
  Task,
  TaskStatus,
  User,
} from "@/domain/types";
import {
  categoryNameKey,
  MAX_CATEGORIES_PER_PROJECT,
  MAX_OPEN_PROJECTS,
  parseCategoryName,
  parseProjectAcronym,
  parseProjectName,
} from "@/lib/project";

export const DEMO_STORAGE_KEY = "sirrelay-demo";
export const DEMO_NAME_MAX = 40;
export const DEMO_PROFILE_EMAIL = "demo@sirrelay.local";

export type DemoPreset = {
  teammates: string[];
  projects: { name: string; acronym: string; categories: string[] }[];
  tasks: { title: string; who: string; project: string; due?: boolean }[];
};

export type DemoPresetOption = {
  id: string;
  label: string;
  seed: DemoPreset;
};

export type DemoMember = {
  id: string;
  name: string;
  role: "operator" | "teammate";
};

export type DemoWorkspace = {
  selfId: string;
  groupId: string;
  members: DemoMember[];
  tasks: Task[];
  projects: ManagedProject[];
};

export type DemoProjectError = "acronym" | "name" | "taken" | "limit" | null;
export type DemoCategoryError = "name" | "taken" | "limit" | null;

function nid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeTask(title: string, assignee: DemoMember, sortOrder: number): Task {
  const now = nowIso();
  return {
    id: nid("demo-task"),
    title,
    description: "",
    assigneeId: assignee.id,
    assigneeName: assignee.name,
    status: "todo",
    difficulty: null,
    dueDate: null,
    telegramNotifyFailed: false,
    sortOrder,
    projectId: null,
    projectAcronym: null,
    categoryId: null,
    categoryName: null,
    updatedAt: now,
    createdAt: now,
  };
}

function asStringList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const rows = value.map((item) => (typeof item === "string" ? item.trim() : ""));
  return rows.every((item) => item.length > 0) ? rows : null;
}

/** Preset copy lives in messages. This only accepts a well-formed map. */
export function parseDemoPresets(raw: unknown): DemoPresetOption[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const options: DemoPresetOption[] = [];
  for (const [id, value] of Object.entries(raw)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const row = value as Record<string, unknown>;
    const label = typeof row.label === "string" ? row.label.trim() : "";
    const teammates = asStringList(row.teammates);
    if (!label || !teammates) continue;
    if (!Array.isArray(row.projects) || !Array.isArray(row.tasks)) continue;

    const projects: DemoPreset["projects"] = [];
    for (const item of row.projects) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const project = item as Record<string, unknown>;
      const name = typeof project.name === "string" ? parseProjectName(project.name) : null;
      const acronym = typeof project.acronym === "string" ? parseProjectAcronym(project.acronym) : null;
      const categories = asStringList(project.categories)
        ?.map((category) => parseCategoryName(category))
        .filter((category): category is string => Boolean(category));
      if (!name || !acronym || !categories?.length) continue;
      if (categories.length > MAX_CATEGORIES_PER_PROJECT) continue;
      projects.push({ name, acronym, categories });
    }
    if (projects.length === 0 || projects.length > MAX_OPEN_PROJECTS) continue;

    const known = new Set(projects.map((project) => project.acronym));
    const people = new Set(teammates.map((person) => person.toLowerCase()));
    const tasks: DemoPreset["tasks"] = [];
    for (const item of row.tasks) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const task = item as Record<string, unknown>;
      const title = typeof task.title === "string" ? task.title.trim().slice(0, 200) : "";
      const who = typeof task.who === "string" ? task.who.trim() : "";
      const project = typeof task.project === "string" ? parseProjectAcronym(task.project) : null;
      const whoOk = who.toLowerCase() === "self" || people.has(who.toLowerCase());
      if (!title || !whoOk || !project || !known.has(project)) continue;
      tasks.push({ title, who, project, due: task.due === true });
    }
    if (tasks.length === 0) continue;
    options.push({ id, label, seed: { teammates, projects, tasks } });
  }
  return options;
}

export function createDemoWorkspace(visitorName: string, preset: DemoPreset): DemoWorkspace {
  const name = visitorName.trim().slice(0, DEMO_NAME_MAX);
  if (name.length < 2) throw new Error("Invalid name");
  if (preset.tasks.length === 0) throw new Error("Invalid preset");

  const selfId = nid("demo-self");
  const groupId = nid("demo-g");
  const members: DemoMember[] = [
    { id: selfId, name, role: "operator" },
    ...preset.teammates.map((teammateName) => ({
      id: nid("demo-tm"),
      name: teammateName,
      role: "teammate" as const,
    })),
  ];
  const self = members[0]!;
  const byName = new Map(members.map((member) => [member.name.toLowerCase(), member]));

  const projects: ManagedProject[] = preset.projects.map((seed) => {
    const projectId = nid("demo-p");
    return {
      id: projectId,
      groupId,
      name: seed.name,
      acronym: seed.acronym,
      archivedAt: null,
      pendingAt: null,
      categories: seed.categories.map((catName) => ({
        id: nid("demo-c"),
        projectId,
        name: catName,
      })),
    };
  });
  const byAcronym = new Map(projects.map((project) => [project.acronym, project]));

  const tasks = preset.tasks.map((seed, i) => {
    const assignee =
      seed.who.toLowerCase() === "self" ? self : (byName.get(seed.who.toLowerCase()) ?? self);
    const task = makeTask(seed.title, assignee, i);
    const project = byAcronym.get(seed.project);
    if (project) {
      task.projectId = project.id;
      task.projectAcronym = project.acronym;
      const cat = project.categories[0];
      if (cat) {
        task.categoryId = cat.id;
        task.categoryName = cat.name;
      }
    }
    if (seed.due) task.dueDate = new Date().toISOString().slice(0, 10);
    return task;
  });

  return { selfId, groupId, members, tasks, projects };
}

/** Events follow the board: done tasks, and open tasks due today or earlier. */
export function demoAlerts(tasks: Task[], now = new Date()): OperatorAlert[] {
  const today = now.toISOString().slice(0, 10);
  const alerts: OperatorAlert[] = [];
  for (const task of tasks) {
    if (task.status === "done") {
      alerts.push({
        id: `demo-alert-done-${task.id}`,
        type: "task_done",
        taskId: task.id,
        taskTitle: task.title,
        assigneeName: task.assigneeName,
        dueDate: task.dueDate,
        createdAt: task.updatedAt,
        sentToTelegram: false,
      });
      continue;
    }
    const due = task.dueDate?.slice(0, 10);
    if (due && due <= today) {
      alerts.push({
        id: `demo-alert-due-${task.id}`,
        type: "task_due",
        taskId: task.id,
        taskTitle: task.title,
        assigneeName: task.assigneeName,
        dueDate: task.dueDate,
        createdAt: task.updatedAt,
        sentToTelegram: false,
      });
    }
  }
  return alerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function readDemoWorkspace(): DemoWorkspace | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(DEMO_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DemoWorkspace;
    if (!parsed?.selfId || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.members)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeDemoWorkspace(workspace: DemoWorkspace | null): void {
  if (typeof window === "undefined") return;
  if (!workspace) {
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(workspace));
}

function definedPatch(patch: Partial<Task>): Partial<Task> {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as Partial<Task>;
}

export function demoPatchTask(
  workspace: DemoWorkspace,
  taskId: string,
  patch: Partial<Task>,
): DemoWorkspace {
  const clean = definedPatch(patch);
  const tasks = workspace.tasks.map((task) => {
    if (task.id !== taskId) return task;
    let next = { ...task, ...clean, updatedAt: nowIso() };
    if (clean.assigneeId && clean.assigneeId !== task.assigneeId && !clean.assigneeName) {
      const member = workspace.members.find((row) => row.id === clean.assigneeId);
      if (member) next = { ...next, assigneeName: member.name };
    }
    return next;
  });
  return { ...workspace, tasks };
}

export function demoCreateTask(
  workspace: DemoWorkspace,
  input: {
    title: string;
    assigneeId: string;
    projectId?: string | null;
    projectAcronym?: string | null;
    description?: string;
    dueDate?: string | null;
    difficulty?: Task["difficulty"];
  },
): DemoWorkspace {
  const title = input.title.trim().slice(0, 200);
  if (!title) return workspace;
  const assignee =
    workspace.members.find((member) => member.id === input.assigneeId) ??
    workspace.members.find((member) => member.id === workspace.selfId)!;
  const sortOrder =
    workspace.tasks
      .filter((task) => task.assigneeId === assignee.id && task.status !== "done")
      .reduce((max, task) => Math.max(max, task.sortOrder), -1) + 1;
  const task = makeTask(title, assignee, sortOrder);
  if (input.description?.trim()) task.description = input.description.trim().slice(0, 10_000);
  if (input.dueDate) task.dueDate = input.dueDate;
  if (input.difficulty) task.difficulty = input.difficulty;
  if (input.projectId) {
    const project = workspace.projects.find((row) => row.id === input.projectId);
    task.projectId = input.projectId;
    task.projectAcronym = project?.acronym ?? input.projectAcronym ?? null;
  }
  return { ...workspace, tasks: [...workspace.tasks, task] };
}

export function demoDeleteTask(workspace: DemoWorkspace, taskId: string): DemoWorkspace {
  return {
    ...workspace,
    tasks: workspace.tasks.filter((task) => task.id !== taskId),
  };
}

export function demoCloneTask(workspace: DemoWorkspace, taskId: string): DemoWorkspace {
  const source = workspace.tasks.find((task) => task.id === taskId);
  if (!source) return workspace;
  const assignee =
    workspace.members.find((member) => member.id === source.assigneeId) ?? {
      id: source.assigneeId,
      name: source.assigneeName,
      role: "teammate" as const,
    };
  const clone = makeTask(source.title, assignee, source.sortOrder + 0.5);
  clone.description = source.description;
  clone.status = source.status;
  clone.dueDate = source.dueDate;
  clone.difficulty = source.difficulty;
  clone.projectId = source.projectId;
  clone.projectAcronym = source.projectAcronym;
  clone.categoryId = source.categoryId;
  clone.categoryName = source.categoryName;
  const index = workspace.tasks.findIndex((task) => task.id === taskId);
  const tasks = [...workspace.tasks];
  tasks.splice(index + 1, 0, clone);
  return { ...workspace, tasks };
}

export function demoPlaceInTodoQueue(
  workspace: DemoWorkspace,
  taskId: string,
  assigneeId: string,
  orderedTodoIds: string[],
): DemoWorkspace {
  const member = workspace.members.find((row) => row.id === assigneeId);
  const order = new Map(orderedTodoIds.map((id, index) => [id, index]));
  const now = nowIso();
  const tasks = workspace.tasks.map((task) => {
    if (task.id === taskId) {
      return {
        ...task,
        assigneeId,
        assigneeName: member?.name ?? task.assigneeName,
        status: "todo" as TaskStatus,
        sortOrder: order.get(taskId) ?? task.sortOrder,
        updatedAt: now,
      };
    }
    const sortOrder = order.get(task.id);
    return sortOrder === undefined ? task : { ...task, sortOrder, updatedAt: now };
  });
  return { ...workspace, tasks };
}

export function demoAddMember(workspace: DemoWorkspace, name: string): DemoWorkspace | null {
  const trimmed = name.trim().slice(0, DEMO_NAME_MAX);
  if (trimmed.length < 2) return null;
  return {
    ...workspace,
    members: [
      ...workspace.members,
      { id: nid("demo-tm"), name: trimmed, role: "teammate" },
    ],
  };
}

function openProjects(workspace: DemoWorkspace): ManagedProject[] {
  return workspace.projects.filter((project) => !project.archivedAt && !project.pendingAt);
}

export function demoCreateProject(
  workspace: DemoWorkspace,
  input: { name: string; acronym: string },
): { workspace: DemoWorkspace; error: DemoProjectError } {
  const name = parseProjectName(input.name);
  const acronym = parseProjectAcronym(input.acronym);
  if (!name) return { workspace, error: "name" };
  if (!acronym) return { workspace, error: "acronym" };
  const open = openProjects(workspace);
  if (open.length >= MAX_OPEN_PROJECTS) return { workspace, error: "limit" };
  if (
    open.some(
      (project) =>
        project.acronym === acronym || project.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    return { workspace, error: "taken" };
  }
  const project: ManagedProject = {
    id: nid("demo-p"),
    groupId: workspace.groupId,
    name,
    acronym,
    archivedAt: null,
    pendingAt: null,
    categories: [],
  };
  return { workspace: { ...workspace, projects: [...workspace.projects, project] }, error: null };
}

export function demoArchiveProject(workspace: DemoWorkspace, projectId: string): DemoWorkspace {
  const archivedAt = nowIso();
  return {
    ...workspace,
    projects: workspace.projects.map((project) =>
      project.id === projectId ? { ...project, archivedAt } : project,
    ),
  };
}

export function demoAddCategory(
  workspace: DemoWorkspace,
  projectId: string,
  rawName: string,
): { workspace: DemoWorkspace; error: DemoCategoryError } {
  const name = parseCategoryName(rawName);
  if (!name) return { workspace, error: "name" };
  const project = workspace.projects.find((row) => row.id === projectId);
  if (!project || project.archivedAt) return { workspace, error: "name" };
  if (project.categories.length >= MAX_CATEGORIES_PER_PROJECT) {
    return { workspace, error: "limit" };
  }
  const key = categoryNameKey(name);
  if (project.categories.some((category) => categoryNameKey(category.name) === key)) {
    return { workspace, error: "taken" };
  }
  const projects = workspace.projects.map((row) =>
    row.id === projectId
      ? {
          ...row,
          categories: [...row.categories, { id: nid("demo-c"), projectId, name }],
        }
      : row,
  );
  return { workspace: { ...workspace, projects }, error: null };
}

export function demoRemoveCategory(workspace: DemoWorkspace, categoryId: string): DemoWorkspace {
  return {
    ...workspace,
    projects: workspace.projects.map((project) => ({
      ...project,
      categories: project.categories.filter((category) => category.id !== categoryId),
    })),
  };
}

const LOCALES = ["en-gb", "es-es", "pt-br"] as const;

export function demoLocale(locale: string): Locale {
  return (LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : "en-gb";
}

function emailLocal(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 32);
  return slug || "member";
}

export function demoMemberAsUser(
  member: DemoMember,
  selfId: string,
  locale: string,
): User {
  const isSelf = member.id === selfId;
  return {
    id: member.id,
    name: member.name,
    email: isSelf ? DEMO_PROFILE_EMAIL : `${emailLocal(member.name)}@demo.local`,
    role: member.role,
    locale: demoLocale(locale),
    active: true,
    telegramStatus: "pending",
  };
}
