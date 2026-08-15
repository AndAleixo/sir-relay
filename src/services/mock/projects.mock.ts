import type { Project, Session } from "@/domain/types";
import type { ProjectService } from "@/services/contracts";
import { requireActiveGroupId, requireOperator } from "@/lib/authz";
import { parseProjectAcronym, parseProjectName, resolveStoredProjectId, MAX_OPEN_PROJECTS } from "@/lib/project";

const SEED: Project[] = [
  {
    id: "project-shop",
    groupId: "group-demo",
    name: "Shop floor",
    acronym: "SHOP",
    archivedAt: null,
  },
  {
    id: "project-web",
    groupId: "group-demo",
    name: "Web",
    acronym: "WEB",
    archivedAt: null,
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

function mockOpenIds(session: Session): string[] {
  return inGroup(session)
    .filter((project) => project.archivedAt === null)
    .map((project) => project.id);
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
  const project = inGroup(session).find(
    (row) => row.id === projectId && row.archivedAt === null,
  );
  if (!project) return { projectId: null, projectAcronym: null };
  return { projectId: project.id, projectAcronym: project.acronym };
}

export const mockProjectService: ProjectService = {
  async listOpen(ctx) {
    return inGroup(ctx.session).filter((project) => project.archivedAt === null);
  },

  async create(input, ctx) {
    const groupId = requireOperator(ctx.session);
    const name = parseProjectName(input.name);
    const acronym = parseProjectAcronym(input.acronym);
    if (!name) throw new Error("Invalid name");
    if (!acronym) throw new Error("Invalid acronym");
    const open = inGroup(ctx.session).filter((project) => project.archivedAt === null);
    if (open.length >= MAX_OPEN_PROJECTS) throw new Error("Limit");
    const taken = inGroup(ctx.session).some(
      (project) => project.archivedAt === null && project.acronym === acronym,
    );
    if (taken) throw new Error("Taken");
    const project: Project = {
      id: `project-${Date.now()}`,
      groupId,
      name,
      acronym,
      archivedAt: null,
    };
    store().projects.push(project);
    return project;
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
