import type { Project } from "@/domain/types";
import type { ProjectService } from "@/services/contracts";
import { requireActiveGroupId, requireOperator } from "@/lib/authz";
import { parseProjectAcronym, parseProjectName, MAX_OPEN_PROJECTS } from "@/lib/project";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function toProject(row: {
  id: string;
  groupId: string;
  name: string;
  acronym: string;
  archivedAt: Date | null;
}): Project {
  return {
    id: row.id,
    groupId: row.groupId,
    name: row.name,
    acronym: row.acronym,
    archivedAt: row.archivedAt?.toISOString() ?? null,
  };
}

export async function resolveOpenProjectId(
  groupId: string,
  raw: string | null | undefined,
): Promise<string | null> {
  const id = raw?.trim() ?? "";
  if (!id) return null;
  const row = await prisma.project.findFirst({
    where: { id, groupId, archivedAt: null },
  });
  if (!row) throw new Error("Invalid project");
  return row.id;
}

export const apiProjectService: ProjectService = {
  async listOpen(ctx) {
    const groupId = requireActiveGroupId(ctx.session);
    const rows = await prisma.project.findMany({
      where: { groupId, archivedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toProject);
  },

  async create(input, ctx) {
    const groupId = requireOperator(ctx.session);
    const name = parseProjectName(input.name);
    const acronym = parseProjectAcronym(input.acronym);
    if (!name) throw new Error("Invalid name");
    if (!acronym) throw new Error("Invalid acronym");

    const openCount = await prisma.project.count({
      where: { groupId, archivedAt: null },
    });
    if (openCount >= MAX_OPEN_PROJECTS) throw new Error("Limit");

    try {
      const row = await prisma.project.create({
        data: { groupId, name, acronym },
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
};
