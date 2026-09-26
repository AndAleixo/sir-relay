import type { ManagedProject, Project } from "@/domain/types";
import type { ProjectService } from "@/services/contracts";
import { requireActiveGroupId, requireOperator } from "@/lib/authz";
import {
  parseProjectAcronym,
  parseProjectName,
  ACCEPTED_PROJECT,
  MAX_OPEN_PROJECTS,
  MAX_PENDING_PROJECTS,
  MAX_CATEGORIES_PER_PROJECT,
  parseCategoryName,
  sortProjectsForSettings,
} from "@/lib/project";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function toProject(row: {
  id: string;
  groupId: string;
  name: string;
  acronym: string;
  archivedAt: Date | null;
  pendingAt: Date | null;
}): Project {
  return {
    id: row.id,
    groupId: row.groupId,
    name: row.name,
    acronym: row.acronym,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    pendingAt: row.pendingAt?.toISOString() ?? null,
  };
}

function toManaged(
  row: Parameters<typeof toProject>[0] & {
    categories: { id: string; projectId: string; name: string }[];
  },
): ManagedProject {
  return {
    ...toProject(row),
    categories: row.categories.map((category) => ({
      id: category.id,
      projectId: category.projectId,
      name: category.name,
    })),
  };
}

async function insertProject(
  groupId: string,
  name: string,
  acronym: string,
  pending: boolean,
): Promise<Project> {
  try {
    const row = await prisma.project.create({
      data: {
        groupId,
        name,
        acronym,
        pendingAt: pending ? new Date() : null,
      },
    });
    return toProject(row);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Taken");
    }
    throw error;
  }
}

export async function resolveOpenProjectId(
  groupId: string,
  raw: string | null | undefined,
): Promise<string | null> {
  const id = raw?.trim() ?? "";
  if (!id) return null;
  const row = await prisma.project.findFirst({
    where: { id, groupId, ...ACCEPTED_PROJECT },
  });
  if (!row) throw new Error("Invalid project");
  return row.id;
}

export const apiProjectService: ProjectService = {
  async listOpen(ctx) {
    const groupId = requireActiveGroupId(ctx.session);
    const rows = await prisma.project.findMany({
      where: { groupId, ...ACCEPTED_PROJECT },
      orderBy: { createdAt: "asc" },
      include: {
        categories: {
          where: { archivedAt: null },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return rows.map(toManaged);
  },

  async listInGroup(ctx) {
    const groupId = requireActiveGroupId(ctx.session);
    const rows = await prisma.project.findMany({
      where: { groupId, archivedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        categories: {
          where: { archivedAt: null },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return sortProjectsForSettings(rows.map(toManaged));
  },

  async create(input, ctx) {
    const groupId = requireOperator(ctx.session);
    const name = parseProjectName(input.name);
    const acronym = parseProjectAcronym(input.acronym);
    if (!name) throw new Error("Invalid name");
    if (!acronym) throw new Error("Invalid acronym");

    const openCount = await prisma.project.count({
      where: { groupId, ...ACCEPTED_PROJECT },
    });
    if (openCount >= MAX_OPEN_PROJECTS) throw new Error("Limit");

    return insertProject(groupId, name, acronym, false);
  },

  async request(input, ctx) {
    const groupId = requireActiveGroupId(ctx.session);
    if (ctx.session.user.role !== "teammate") throw new Error("Forbidden");
    const name = parseProjectName(input.name);
    const acronym = parseProjectAcronym(input.acronym);
    if (!name) throw new Error("Invalid name");
    if (!acronym) throw new Error("Invalid acronym");

    const openCount = await prisma.project.count({
      where: { groupId, ...ACCEPTED_PROJECT },
    });
    if (openCount >= MAX_OPEN_PROJECTS) throw new Error("Limit");

    const pendingCount = await prisma.project.count({
      where: { groupId, archivedAt: null, pendingAt: { not: null } },
    });
    if (pendingCount >= MAX_PENDING_PROJECTS) throw new Error("PendingLimit");

    return insertProject(groupId, name, acronym, true);
  },

  async accept(id, ctx) {
    const groupId = requireOperator(ctx.session);
    const row = await prisma.project.findFirst({
      where: { id, groupId, archivedAt: null, pendingAt: { not: null } },
    });
    if (!row) throw new Error("Not found");

    const openCount = await prisma.project.count({
      where: { groupId, ...ACCEPTED_PROJECT },
    });
    if (openCount >= MAX_OPEN_PROJECTS) throw new Error("Limit");

    await prisma.project.update({
      where: { id },
      data: { pendingAt: null },
    });
  },

  async archive(id, ctx) {
    const groupId = requireOperator(ctx.session);
    const row = await prisma.project.findFirst({
      where: { id, groupId, archivedAt: null },
    });
    if (!row) throw new Error("Not found");
    await prisma.project.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  },

  async createCategory(input, ctx) {
    const groupId = requireActiveGroupId(ctx.session);
    const name = parseCategoryName(input.name);
    if (!name) throw new Error("Invalid name");

    const project = await prisma.project.findFirst({
      where: { id: input.projectId, groupId, ...ACCEPTED_PROJECT },
    });
    if (!project) throw new Error("Not found");

    const openCount = await prisma.projectCategory.count({
      where: { projectId: project.id, archivedAt: null },
    });
    if (openCount >= MAX_CATEGORIES_PER_PROJECT) throw new Error("Limit");

    try {
      const row = await prisma.projectCategory.create({
        data: { projectId: project.id, name },
      });
      return { id: row.id, projectId: row.projectId, name: row.name };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error("Taken");
      }
      throw error;
    }
  },

  async archiveCategory(id, ctx) {
    const groupId = requireActiveGroupId(ctx.session);
    const row = await prisma.projectCategory.findFirst({
      where: {
        id,
        archivedAt: null,
        project: { groupId, archivedAt: null },
      },
    });
    if (!row) throw new Error("Not found");
    await prisma.projectCategory.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  },
};
