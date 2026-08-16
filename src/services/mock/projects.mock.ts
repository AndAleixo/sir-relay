import type { Project, Session } from "@/domain/types";
import type { ProjectService } from "@/services/contracts";
import { requireActiveGroupId, requireOperator } from "@/lib/authz";
import {
  parseProjectAcronym,
  parseProjectName,
  resolveStoredProjectId,
  isPendingProject,
  MAX_OPEN_PROJECTS,
  MAX_PENDING_PROJECTS,
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

type Store = { projects: Project[] };

function store(): Store {
  const key = "__sirrelay_mock_projects__";
  const g = globalThis as typeof globalThis & { [k: string]: Store | undefined };
  if (!g[key]) g[key] = { projects: [...SEED] };
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
    return acceptedOpen(ctx.session);
  },

  async listInGroup(ctx) {
    return sortProjectsForSettings(
      inGroup(ctx.session).filter((project) => project.archivedAt === null),
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
};
