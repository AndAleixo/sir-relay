import type { Role } from "@/domain/types";
import { prisma } from "@/lib/prisma";

export async function pickDefaultGroupIdAsync(userId: string): Promise<string | null> {
  const rows = await prisma.groupMembership.findMany({
    where: { userId },
    select: { groupId: true },
  });
  return rows.length === 1 ? rows[0].groupId : null;
}

export async function roleInGroupAsync(
  userId: string,
  groupId: string,
): Promise<Role | null> {
  const row = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  });
  return row ? (row.role as Role) : null;
}

export async function hasMembershipAsync(
  userId: string,
  groupId: string,
): Promise<boolean> {
  const row = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { groupId: true },
  });
  return Boolean(row);
}
