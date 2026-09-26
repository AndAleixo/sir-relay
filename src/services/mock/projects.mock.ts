import type { ManagedProject, Project, ProjectCategory, Session } from "@/domain/types";
import type { ProjectService } from "@/services/contracts";
import { requireActiveGroupId, requireOperator } from "@/lib/authz";
import {
  parseProjectAcronym,
  parseProjectName,
  parseCategoryName,
  categoryNameKey,
  resolveStoredProjectId,
  isPendingProject,
  MAX_OPEN_PROJECTS,
  MAX_PENDING_PROJECTS,
  MAX_CATEGORIES_PER_PROJECT,
  sortProjectsForSettings,
} from "@/lib/project";

const SEED: Project[] = [
  {
    id: "project-shop",
    groupId: "group-demo",
    name: "Shop floor",
    acronym: "SHP",
    archivedAt: null,
    pendingAt: null,
  },
  {
    id: "project-web",
    groupId: "group-demo",
    name: "Web",
    acronym: "WEB",
    archivedAt: null,
    pendingAt: null,
  },
];

const CATEGORY_SEED: ProjectCategory[] = [
  { id: "category-front", projectId: "project-shop", name: "Front" },
  { id: "category-stock", projectId: "project-shop", name: "Stock" },
  { id: "category-site", projectId: "project-web", name: "Site" },
];

type Store = { projects: Project[]; categories: ProjectCategory[] };

function store(): Store {
  const key = "__sirrelay_mock_projects__";
  const g = globalThis as typeof globalThis & { [k: string]: Store | undefined };
  if (!g[key]?.categories) {
    g[key] = { projects: [...SEED], categories: [...CATEGORY_SEED] };
  }
  return g[key];
}

function inGroup(session: Session): Project[] {
  const groupId = requireActiveGroupId(session);
  return store().projects.filter((project) => project.groupId === groupId);
}

function acceptedOpen(session: Session): Project[] {
  return inGroup(session).filter(
    (project) => project.archivedAt === null && project.pendingAt === null,
  );
}

function mockOpenIds(session: Session): string[] {
  return acceptedOpen(session).map((project) => project.id);
}

function openCategories(projectId: string): ProjectCategory[] {
  return store().categories.filter((row) => row.projectId === projectId);
}

export function mockOpenCategoryIds(projectId: string | null): string[] {
  if (!projectId) return [];
  return openCategories(projectId).map((row) => row.id);
}

export function mockCategoryLabel(categoryId: string | null): string | null {
  if (!categoryId) return null;
  return store().categories.find((row) => row.id === categoryId)?.name ?? null;
}

function withCategories(project: Project): ManagedProject {
  return { ...project, categories: openCategories(project.id) };
}

export function mockProjectTag(
  session: Session,
  raw: string | null | undefined,
  currentId: string | null = null,
): { projectId: string | null; projectAcronym: string | null } {
  const projectId = resolveStoredProjectId(raw, currentId, mockOpenIds(session));
  if (!projectId) return { projectId: null, projectAcronym: null };
  const project = inGroup(session).find((row) => row.id === projectId);
  return { projectId, projectAcronym: project?.acronym ?? null };
}

export function mockCopyOpenProject(
  session: Session,
  projectId: string | null,
): { projectId: string | null; projectAcronym: string | null } {
  if (!projectId) return { projectId: null, projectAcronym: null };
  const project = acceptedOpen(session).find((row) => row.id === projectId);
  if (!project) return { projectId: null, projectAcronym: null };
  return { projectId: project.id, projectAcronym: project.acronym };
}

function parseNew(input: { name: string; acronym: string }): {
  name: string;
  acronym: string;
} {
  const name = parseProjectName(input.name);
  const acronym = parseProjectAcronym(input.acronym);
  if (!name) throw new Error("Invalid name");
  if (!acronym) throw new Error("Invalid acronym");
  return { name, acronym };
}

function assertAcronymFree(session: Session, acronym: string): void {
  const taken = inGroup(session).some(
    (project) => project.archivedAt === null && project.acronym === acronym,
  );
  if (taken) throw new Error("Taken");
}

export const mockProjectService: ProjectService = {
  async listOpen(ctx) {
    return acceptedOpen(ctx.session).map(withCategories);
  },

  async listInGroup(ctx) {
    return sortProjectsForSettings(
      inGroup(ctx.session)
        .filter((project) => project.archivedAt === null)
        .map(withCategories),
    );
  },

  async create(input, ctx) {
    const groupId = requireOperator(ctx.session);
    const { name, acronym } = parseNew(input);
    if (acceptedOpen(ctx.session).length >= MAX_OPEN_PROJECTS) throw new Error("Limit");
    assertAcronymFree(ctx.session, acronym);
    const project: Project = {
      id: `project-${Date.now()}`,
      groupId,
      name,
      acronym,
      archivedAt: null,
      pendingAt: null,
    };
    store().projects.push(project);
    return project;
  },

  async request(input, ctx) {
    const groupId = requireActiveGroupId(ctx.session);
    if (ctx.session.user.role !== "teammate") throw new Error("Forbidden");
    const { name, acronym } = parseNew(input);
    if (acceptedOpen(ctx.session).length >= MAX_OPEN_PROJECTS) throw new Error("Limit");
    const pending = inGroup(ctx.session).filter(isPendingProject);
    if (pending.length >= MAX_PENDING_PROJECTS) throw new Error("PendingLimit");
    assertAcronymFree(ctx.session, acronym);
    const project: Project = {
      id: `project-${Date.now()}`,
      groupId,
      name,
      acronym,
      archivedAt: null,
      pendingAt: new Date().toISOString(),
    };
    store().projects.push(project);
    return project;
  },

  async accept(id, ctx) {
    requireOperator(ctx.session);
    const project = inGroup(ctx.session).find(
      (row) => row.id === id && row.archivedAt === null && row.pendingAt !== null,
    );
    if (!project) throw new Error("Not found");
    if (acceptedOpen(ctx.session).length >= MAX_OPEN_PROJECTS) throw new Error("Limit");
    project.pendingAt = null;
  },

  async archive(id, ctx) {
    requireOperator(ctx.session);
    const project = inGroup(ctx.session).find(
      (row) => row.id === id && row.archivedAt === null,
    );
    if (!project) throw new Error("Not found");
    project.archivedAt = new Date().toISOString();
  },

  async createCategory(input, ctx) {
    requireActiveGroupId(ctx.session);
    const name = parseCategoryName(input.name);
    if (!name) throw new Error("Invalid name");
    const project = acceptedOpen(ctx.session).find((row) => row.id === input.projectId);
    if (!project) throw new Error("Not found");
    const existing = openCategories(project.id);
    if (existing.length >= MAX_CATEGORIES_PER_PROJECT) throw new Error("Limit");
    if (existing.some((row) => categoryNameKey(row.name) === categoryNameKey(name))) {
      throw new Error("Taken");
    }
    const category: ProjectCategory = {
      id: `category-${Date.now()}`,
      projectId: project.id,
      name,
    };
    store().categories.push(category);
    return category;
  },

  async archiveCategory(id, ctx) {
    const groupId = requireActiveGroupId(ctx.session);
    const index = store().categories.findIndex((row) => row.id === id);
    if (index < 0) throw new Error("Not found");
    const category = store().categories[index];
    const project = store().projects.find(
      (row) => row.id === category.projectId && row.groupId === groupId,
    );
    if (!project || project.archivedAt) throw new Error("Not found");
    store().categories.splice(index, 1);
  },
};
