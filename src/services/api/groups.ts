import type { Group, GroupInvitePreview, Role, UserGroup } from "@/domain/types";
import type { GroupService } from "@/services/contracts";
import { prisma } from "@/lib/prisma";
import { pickOwnershipSuccessorId } from "@/lib/group-ownership";
import { writeAudit } from "@/lib/audit";
import { hashToken, newToken } from "@/lib/token-hash";
import { pickDefaultGroupIdAsync } from "@/services/api/membership";
import { toRole, toUserGroup } from "@/services/api/mappers";

const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

function inviteNeedsPassword(accountStatus: string): boolean {
  return accountStatus === "invited";
}

function toGroup(row: { id: string; name: string; ownerUserId: string }): Group {
  return { id: row.id, name: row.name, ownerUserId: row.ownerUserId };
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
        data: { id, name: trimmed, ownerUserId: userId },
      });
      await tx.groupMembership.create({
        data: { groupId: id, userId, role: "operator" },
      });
      await tx.groupAlertPrefs.create({
        data: { groupId: id },
      });
      return created;
    });
    return toGroup(group);
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

    return toGroup(invite.group);
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
    return toGroup(updated);
  }

  async countMembers(groupId: string): Promise<number> {
    return prisma.groupMembership.count({ where: { groupId } });
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const role = await this.roleInGroup(userId, groupId);
    if (!role) throw new Error("not_member");

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerUserId: true },
    });
    if (!group) throw new Error("not_member");

    await prisma.$transaction(async (tx) => {
      const members = await tx.groupMembership.findMany({
        where: { groupId },
        select: { userId: true, role: true, createdAt: true },
      });
      const remaining = members.filter((m) => m.userId !== userId);
      const isOwner = group.ownerUserId === userId;

      if (remaining.length > 0 && isOwner) {
        const successorId = pickOwnershipSuccessorId(
          members.map((m) => ({
            userId: m.userId,
            role: toRole(m.role),
            createdAt: m.createdAt,
          })),
          userId,
        );
        if (!successorId) throw new Error("action_failed");
        const successor = members.find((m) => m.userId === successorId);
        if (successor?.role === "teammate") {
          await tx.groupMembership.update({
            where: { groupId_userId: { groupId, userId: successorId } },
            data: { role: "operator" },
          });
        }
        await tx.group.update({
          where: { id: groupId },
          data: { ownerUserId: successorId },
        });
      }

      await tx.task.deleteMany({
        where: { groupId, assigneeId: userId },
      });
      await tx.groupMembership.delete({
        where: { groupId_userId: { groupId, userId } },
      });
      await tx.user.updateMany({
        where: { id: userId, lastActiveGroupId: groupId },
        data: { lastActiveGroupId: null },
      });
      const left = await tx.groupMembership.count({ where: { groupId } });
      if (left === 0) {
        await tx.user.updateMany({
          where: { lastActiveGroupId: groupId },
          data: { lastActiveGroupId: null },
        });
        await tx.group.delete({ where: { id: groupId } });
      }
    });
  }

  async transferOwnership(
    userId: string,
    groupId: string,
    newOwnerUserId: string,
  ): Promise<void> {
    if (userId === newOwnerUserId) throw new Error("same_owner");

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerUserId: true },
    });
    if (!group) throw new Error("not_member");
    if (group.ownerUserId !== userId) throw new Error("forbidden");

    const target = await prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId: newOwnerUserId } },
    });
    if (!target) throw new Error("not_member");

    const targetUser = await prisma.user.findUnique({
      where: { id: newOwnerUserId },
      select: { active: true, accountStatus: true },
    });
    if (!targetUser?.active || targetUser.accountStatus !== "active") {
      throw new Error("inactive");
    }

    await prisma.$transaction(async (tx) => {
      if (target.role === "teammate") {
        await tx.groupMembership.update({
          where: { groupId_userId: { groupId, userId: newOwnerUserId } },
          data: { role: "operator" },
        });
      }
      await tx.group.update({
        where: { id: groupId },
        data: { ownerUserId: newOwnerUserId },
      });
    });
    void writeAudit({
      groupId,
      action: "group_ownership_transfer",
      actorType: "operator",
      actorId: userId,
      metadata: { userId: newOwnerUserId },
    });
  }

  async deleteGroup(userId: string, groupId: string): Promise<void> {
    const role = await this.roleInGroup(userId, groupId);
    if (role !== "operator") throw new Error("forbidden");

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerUserId: true },
    });
    if (!group || group.ownerUserId !== userId) throw new Error("forbidden");

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
