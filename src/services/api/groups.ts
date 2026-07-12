import type { Group, GroupInvitePreview, UserGroup } from "@/domain/types";
import type { GroupService } from "@/services/contracts";
import { prisma } from "@/lib/prisma";
import { hashToken, newToken } from "@/lib/token-hash";
import { pickDefaultGroupIdAsync } from "@/services/api/membership";
import { toRole, toUserGroup } from "@/services/api/mappers";

const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

function inviteNeedsPassword(accountStatus: string): boolean {
  return accountStatus === "invited";
}

export class ApiGroupService implements GroupService {
  async listForUser(userId: string): Promise<UserGroup[]> {
    const rows = await prisma.groupMembership.findMany({
      where: { userId },
      include: { group: true },
      orderBy: { group: { name: "asc" } },
    });
    return rows.map((row) => toUserGroup(row.group, toRole(row.role)));
  }

  async create(userId: string, name: string): Promise<Group> {
    const trimmed = name.trim();
    const id = `group-${Date.now().toString(36)}`;
    const group = await prisma.$transaction(async (tx) => {
      const created = await tx.group.create({
        data: { id, name: trimmed },
      });
      await tx.groupMembership.create({
        data: { groupId: id, userId, role: "operator" },
      });
      await tx.groupAlertPrefs.create({
        data: { groupId: id },
      });
      return created;
    });
    return { id: group.id, name: group.name };
  }

  async roleInGroup(userId: string, groupId: string) {
    const row = await prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { role: true },
    });
    return row ? toRole(row.role) : null;
  }

  async isMember(userId: string, groupId: string): Promise<boolean> {
    const row = await prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { groupId: true },
    });
    return Boolean(row);
  }

  async previewInvite(token: string): Promise<GroupInvitePreview | null> {
    const tokenHash = hashToken(token);
    const invite = await prisma.teammateInviteToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true, group: true },
    });
    if (!invite) return null;

    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: { groupId: invite.groupId, userId: invite.userId },
      },
    });

    return {
      groupId: invite.group.id,
      groupName: invite.group.name,
      email: invite.user.email,
      role: membership ? toRole(membership.role) : "teammate",
      needsPassword: inviteNeedsPassword(invite.user.accountStatus),
    };
  }

  async acceptInvite(userId: string, token: string): Promise<Group> {
    const tokenHash = hashToken(token);
    const invite = await prisma.teammateInviteToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true, group: true },
    });
    if (!invite) throw new Error("Invalid invite");

    const accepting = await prisma.user.findUnique({ where: { id: userId } });
    if (!accepting || accepting.email.toLowerCase() !== invite.user.email.toLowerCase()) {
      throw new Error("Invite is for a different account");
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.groupMembership.findUnique({
        where: {
          groupId_userId: { groupId: invite.groupId, userId },
        },
      });
      if (!existing) {
        await tx.groupMembership.create({
          data: {
            groupId: invite.groupId,
            userId,
            role: "teammate",
          },
        });
      }
      if (accepting.accountStatus === "invited") {
        await tx.user.update({
          where: { id: userId },
          data: { accountStatus: "active" },
        });
      }
      await tx.teammateInviteToken.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
    });

    return { id: invite.group.id, name: invite.group.name };
  }

  async pickResumeGroupId(userId: string): Promise<string | null> {
    return pickDefaultGroupIdAsync(userId);
  }

  async renameGroup(userId: string, groupId: string, name: string): Promise<Group> {
    const role = await this.roleInGroup(userId, groupId);
    if (role !== "operator") throw new Error("forbidden");

    const trimmed = name.trim();
    if (trimmed.length < 2) throw new Error("short");

    const updated = await prisma.group.update({
      where: { id: groupId },
      data: { name: trimmed },
    });
    return { id: updated.id, name: updated.name };
  }

  async countMembers(groupId: string): Promise<number> {
    return prisma.groupMembership.count({ where: { groupId } });
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const role = await this.roleInGroup(userId, groupId);
    if (!role) throw new Error("not_member");

    const [operators, members] = await Promise.all([
      prisma.groupMembership.count({ where: { groupId, role: "operator" } }),
      prisma.groupMembership.count({ where: { groupId } }),
    ]);
    if (role === "operator" && operators === 1 && members > 1) {
      throw new Error("last_operator");
    }

    await prisma.$transaction(async (tx) => {
      await tx.groupMembership.delete({
        where: { groupId_userId: { groupId, userId } },
      });
      await tx.user.updateMany({
        where: { id: userId, lastActiveGroupId: groupId },
        data: { lastActiveGroupId: null },
      });
      const remaining = await tx.groupMembership.count({ where: { groupId } });
      if (remaining === 0) {
        await tx.user.updateMany({
          where: { lastActiveGroupId: groupId },
          data: { lastActiveGroupId: null },
        });
        await tx.group.delete({ where: { id: groupId } });
      }
    });
  }

  async deleteGroup(userId: string, groupId: string): Promise<void> {
    const role = await this.roleInGroup(userId, groupId);
    if (role !== "operator") throw new Error("forbidden");

    await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { lastActiveGroupId: groupId },
        data: { lastActiveGroupId: null },
      });
      await tx.group.delete({ where: { id: groupId } });
    });
  }
}

/** Create invite token row; returns plain token for URLs. */
export async function createInviteTokenRecord(
  userId: string,
  groupId: string,
): Promise<string> {
  const token = newToken("invite");
  await prisma.teammateInviteToken.create({
    data: {
      userId,
      groupId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  return token;
}

export async function createTelegramLinkTokenRecord(userId: string): Promise<string> {
  const token = newToken("tg");
  await prisma.telegramLinkToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  return token;
}

export const apiGroupService = new ApiGroupService();
