import type { GroupInvitation } from "@/domain/types";
import type { GroupInvitationService } from "@/services/contracts";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

type InvitationRow = {
  id: string;
  groupId: string;
  invitedUserId: string;
  status: "pending" | "accepted" | "declined";
  expiresAt: Date;
  group: { name: string };
  invitedUser: { name: string; email: string };
};

function toInvitation(row: InvitationRow): GroupInvitation {
  return {
    id: row.id,
    groupId: row.groupId,
    groupName: row.group.name,
    invitedUserId: row.invitedUserId,
    invitedUserName: row.invitedUser.name.trim() || row.invitedUser.email,
    invitedUserEmail: row.invitedUser.email,
    role: "teammate",
    status:
      row.status === "pending" && row.expiresAt <= new Date()
        ? "expired"
        : row.status === "declined"
          ? "declined"
          : "pending",
    expiresAt: row.expiresAt.toISOString(),
  };
}

const invitationInclude = {
  group: { select: { name: true } },
  invitedUser: { select: { name: true, email: true } },
} as const;

async function serializable<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (
        !(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034"
        ) ||
        attempt === 2
      ) {
        throw error;
      }
    }
  }
  throw new Error("transaction_failed");
}

export async function createOrRefreshGroupInvitation(input: {
  groupId: string;
  invitedUserId: string;
  invitedByUserId: string;
}): Promise<GroupInvitation> {
  return serializable(async (tx) => {
    const [inviter, recipient, membership] = await Promise.all([
      tx.groupMembership.findUnique({
        where: {
          groupId_userId: {
            groupId: input.groupId,
            userId: input.invitedByUserId,
          },
        },
        select: { role: true },
      }),
      tx.user.findUnique({
        where: { id: input.invitedUserId },
        select: { active: true, accountStatus: true },
      }),
      tx.groupMembership.findUnique({
        where: {
          groupId_userId: {
            groupId: input.groupId,
            userId: input.invitedUserId,
          },
        },
        select: { userId: true },
      }),
    ]);
    if (inviter?.role !== "operator") throw new Error("forbidden");
    if (!recipient?.active || recipient.accountStatus !== "active") {
      throw new Error("account_inactive");
    }
    if (membership) throw new Error("already_in_group");

    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
    const row = await tx.groupInvitation.upsert({
      where: {
        groupId_invitedUserId: {
          groupId: input.groupId,
          invitedUserId: input.invitedUserId,
        },
      },
      create: {
        ...input,
        status: "pending",
        expiresAt,
      },
      update: {
        invitedByUserId: input.invitedByUserId,
        status: "pending",
        expiresAt,
        respondedAt: null,
      },
      include: invitationInclude,
    });
    return toInvitation(row);
  });
}

export class ApiGroupInvitationService implements GroupInvitationService {
  async listForUser(userId: string): Promise<GroupInvitation[]> {
    const rows = await prisma.groupInvitation.findMany({
      where: {
        invitedUserId: userId,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
      include: invitationInclude,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toInvitation);
  }

  async listForGroup(ctx: Parameters<GroupInvitationService["listForGroup"]>[0]) {
    const groupId = ctx.session.activeGroupId;
    if (!groupId) throw new Error("forbidden");

    const rows = await prisma.groupInvitation.findMany({
      where: { groupId, status: { in: ["pending", "declined"] } },
      include: invitationInclude,
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(toInvitation);
  }

  async accept(invitationId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const invitation = await tx.groupInvitation.findUnique({
        where: { id: invitationId },
        include: { group: true },
      });
      if (!invitation) throw new Error("invitation_invalid");

      const claimed = await tx.groupInvitation.updateMany({
        where: {
          id: invitationId,
          invitedUserId: userId,
          status: "pending",
          expiresAt: { gt: new Date() },
        },
        data: { status: "accepted", respondedAt: new Date() },
      });
      if (claimed.count !== 1) throw new Error("invitation_invalid");

      await tx.groupMembership.createMany({
        data: [{
          groupId: invitation.groupId,
          userId,
          role: "teammate",
        }],
        skipDuplicates: true,
      });
      return {
        id: invitation.group.id,
        name: invitation.group.name,
        ownerUserId: invitation.group.ownerUserId,
      };
    });
  }

  async decline(invitationId: string, userId: string): Promise<void> {
    const updated = await prisma.groupInvitation.updateMany({
      where: {
        id: invitationId,
        invitedUserId: userId,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
      data: { status: "declined", respondedAt: new Date() },
    });
    if (updated.count !== 1) throw new Error("invitation_invalid");
  }

  async resend(
    invitationId: string,
    ctx: Parameters<GroupInvitationService["resend"]>[1],
  ): Promise<GroupInvitation> {
    const groupId = ctx.session.activeGroupId;
    if (!groupId || ctx.session.user.role !== "operator") throw new Error("forbidden");

    const invitation = await prisma.groupInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation || invitation.groupId !== groupId) {
      throw new Error("invitation_not_found");
    }
    return createOrRefreshGroupInvitation({
      groupId,
      invitedUserId: invitation.invitedUserId,
      invitedByUserId: ctx.session.user.id,
    });
  }
}

export const apiGroupInvitationService = new ApiGroupInvitationService();
