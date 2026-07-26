import type { Locale, Session, Teammate } from "@/domain/types";
import { Prisma } from "@prisma/client";
import type {
  CreateTeammateInput,
  CreateTeammateResult,
  OrganizationUser,
  TeammateService,
  UserService,
} from "@/services/contracts";
import { defaultLocale } from "@/i18n/config";
import { requireOperator, requireSelfUserId } from "@/lib/authz";
import { writeAuditFromSession } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  createInviteTokenRecord,
  createTelegramLinkTokenRecord,
} from "@/services/api/groups";
import { createOrRefreshGroupInvitation } from "@/services/api/invitations";
import { fromLocale, toRole, toTeammate, toUser } from "@/services/api/mappers";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function requireGroupId(session: Session): string {
  const groupId = session.activeGroupId;
  if (!groupId) throw new Error("No active group");
  return groupId;
}

async function requireMemberInGroup(
  ctx: { session: Session },
  id: string,
): Promise<OrganizationUser> {
  const groupId = requireGroupId(ctx.session);
  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: id } },
    include: { user: true },
  });
  if (!membership || !membership.user.active) {
    throw new Error("Member not found");
  }
  const role = toRole(membership.role);
  return role === "teammate"
    ? toTeammate(membership.user, role, membership.displayName)
    : (toUser(membership.user, role, membership.displayName) as OrganizationUser);
}

async function requireTeammateInGroup(
  ctx: { session: Session },
  id: string,
): Promise<Teammate> {
  const member = await requireMemberInGroup(ctx, id);
  if (member.role !== "teammate") {
    throw new Error("Teammate not found");
  }
  return member;
}

export class ApiTeammateService implements TeammateService {
  async listTeammates(ctx: { session: Session }): Promise<Teammate[]> {
    const groupId = requireGroupId(ctx.session);
    const rows = await prisma.groupMembership.findMany({
      where: { groupId, role: "teammate" },
      include: { user: true },
    });
    return rows
      .filter((row) => row.user.active)
      .map((row) => toTeammate(row.user, "teammate", row.displayName));
  }

  async listOrganizationUsers(ctx: { session: Session }): Promise<OrganizationUser[]> {
    const groupId = requireGroupId(ctx.session);
    const rows = await prisma.groupMembership.findMany({
      where: { groupId },
      include: { user: true },
    });
    return rows
      .filter((row) => row.user.active)
      .map((row) => {
        const role = toRole(row.role);
        return role === "teammate"
          ? toTeammate(row.user, role, row.displayName)
          : (toUser(row.user, role, row.displayName) as OrganizationUser);
      });
  }

  async getTeammate(id: string, ctx: { session: Session }): Promise<Teammate | null> {
    try {
      return await requireTeammateInGroup(ctx, id);
    } catch {
      return null;
    }
  }

  async getOrganizationUser(
    id: string,
    ctx: { session: Session },
  ): Promise<OrganizationUser | null> {
    try {
      return await requireMemberInGroup(ctx, id);
    } catch {
      return null;
    }
  }

  async createTeammate(
    input: CreateTeammateInput,
    ctx: { session: Session },
  ): Promise<CreateTeammateResult> {
    if (ctx.session.user.role !== "operator") throw new Error("Forbidden");
    const groupId = requireGroupId(ctx.session);
    const email = input.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      const member = await prisma.groupMembership.findUnique({
        where: { groupId_userId: { groupId, userId: existing.id } },
      });
      if (member) {
        return { ok: false as const, reason: "already_in_group" as const };
      }
      if (!existing.active) {
        return { ok: false, reason: "account_inactive" };
      }
      if (existing.accountStatus === "active") {
        const invitation = await createOrRefreshGroupInvitation({
          groupId,
          invitedUserId: existing.id,
          invitedByUserId: ctx.session.user.id,
        });
        void writeAuditFromSession(ctx.session, "teammate_create", {
          kind: "invitation",
          userId: existing.id,
        });
        return { ok: true, kind: "invitation", invitation };
      }

      try {
        await prisma.$transaction(async (tx) => {
          await tx.groupMembership.create({
            data: { groupId, userId: existing.id, role: "teammate" },
          });
        });
        void writeAuditFromSession(ctx.session, "teammate_create", {
          kind: "membership",
          userId: existing.id,
        });
        return {
          ok: true as const,
          kind: "membership" as const,
          teammate: toTeammate(existing, "teammate", null),
        };
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return { ok: false, reason: "already_in_group" };
        }
        throw error;
      }
    }

    const id = `user-${Date.now().toString(36)}`;
    try {
      const user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            id,
            name: "",
            email,
            locale: fromLocale(defaultLocale),
            accountStatus: "invited",
            active: true,
          },
        });
        await tx.groupMembership.create({
          data: { groupId, userId: id, role: "teammate" },
        });
        return created;
      });
      void writeAuditFromSession(ctx.session, "teammate_create", {
        kind: "membership",
        userId: id,
      });
      return {
        ok: true as const,
        kind: "membership" as const,
        teammate: toTeammate(user, "teammate", null),
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return this.createTeammate(input, ctx);
      }
      throw error;
    }
  }

  async updateTeammate(
    id: string,
    input: { displayName?: string | null; email?: string },
    ctx: { session: Session },
  ): Promise<OrganizationUser> {
    if (ctx.session.user.role !== "operator") throw new Error("Forbidden");
    const member = await requireMemberInGroup(ctx, id);

    if (input.email?.trim()) {
      if (member.role !== "teammate" || member.accountStatus !== "invited") {
        throw new Error("Email can only change before first login");
      }
      await prisma.user.update({
        where: { id },
        data: { email: input.email.trim().toLowerCase() },
      });
    }

    if (input.displayName !== undefined) {
      await this.updateMembershipDisplayName(id, input.displayName, ctx);
    }

    return requireMemberInGroup(ctx, id);
  }

  async updateMembershipDisplayName(
    userId: string,
    displayName: string | null,
    ctx: { session: Session },
  ): Promise<void> {
    const groupId = requireGroupId(ctx.session);
    const isSelf = ctx.session.user.id === userId;
    const isOperator = ctx.session.user.role === "operator";
    if (!isSelf && !isOperator) throw new Error("Forbidden");

    const membership = await prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new Error("Membership not found");

    await prisma.groupMembership.update({
      where: { groupId_userId: { groupId, userId } },
      data: { displayName: displayName?.trim() || null },
    });
  }

  async removeTeammate(id: string, ctx: { session: Session }): Promise<void> {
    if (ctx.session.user.role !== "operator") throw new Error("Forbidden");
    if (id === ctx.session.user.id) throw new Error("Cannot remove yourself");
    await requireMemberInGroup(ctx, id);
    const groupId = requireGroupId(ctx.session);
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerUserId: true },
    });
    if (group?.ownerUserId === id) throw new Error("is_owner");

    await prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({
        where: { groupId, assigneeId: id },
      });
      await tx.teammateInviteToken.updateMany({
        where: { userId: id, groupId, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.groupMembership.delete({
        where: { groupId_userId: { groupId, userId: id } },
      });
      await tx.user.updateMany({
        where: { id, lastActiveGroupId: groupId },
        data: { lastActiveGroupId: null },
      });
    });
    void writeAuditFromSession(ctx.session, "teammate_remove", { userId: id });
  }

  async promoteToOperator(id: string, ctx: { session: Session }): Promise<void> {
    if (ctx.session.user.role !== "operator") throw new Error("Forbidden");
    const groupId = requireGroupId(ctx.session);
    const teammate = await requireTeammateInGroup(ctx, id);
    if (!teammate.active) throw new Error("Inactive user");
    if (teammate.accountStatus !== "active") throw new Error("Account not active");

    await prisma.groupMembership.update({
      where: { groupId_userId: { groupId, userId: id } },
      data: { role: "operator" },
    });
    void writeAuditFromSession(ctx.session, "teammate_promote", { userId: id });
  }

  async demoteToTeammate(id: string, ctx: { session: Session }): Promise<void> {
    if (ctx.session.user.role !== "operator") throw new Error("Forbidden");
    if (id === ctx.session.user.id) throw new Error("Cannot demote yourself");
    const groupId = requireGroupId(ctx.session);
    await requireMemberInGroup(ctx, id);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerUserId: true },
    });
    if (group?.ownerUserId === id) throw new Error("is_owner");

    const membership = await prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId: id } },
    });
    if (!membership || membership.role !== "operator") {
      throw new Error("not_operator");
    }

    const operators = await prisma.groupMembership.count({
      where: { groupId, role: "operator" },
    });
    if (operators <= 1) throw new Error("last_operator");

    await prisma.groupMembership.update({
      where: { groupId_userId: { groupId, userId: id } },
      data: { role: "teammate" },
    });
    void writeAuditFromSession(ctx.session, "teammate_demote", { userId: id });
  }

  async regenerateInvite(id: string, ctx: { session: Session }): Promise<void> {
    requireOperator(ctx.session);
    const teammate = await requireTeammateInGroup(ctx, id);
    if (teammate.accountStatus !== "invited") {
      throw new Error("account_active");
    }
    await prisma.teammateInviteToken.updateMany({
      where: {
        userId: id,
        groupId: requireGroupId(ctx.session),
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });
    void writeAuditFromSession(ctx.session, "invite_regenerate", { userId: id });
  }

  async getInviteToken(id: string, ctx: { session: Session }): Promise<string | null> {
    requireOperator(ctx.session);
    const teammate = await this.getTeammate(id, ctx);
    if (!teammate || teammate.accountStatus !== "invited") return null;
    const groupId = requireGroupId(ctx.session);
    const active = await prisma.teammateInviteToken.findFirst({
      where: { userId: id, groupId, usedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    return active ? null : createInviteTokenRecord(id, groupId);
  }
}

export class ApiUserService implements UserService {
  async updateLocale(userId: string, locale: Locale, ctx: { session: Session }) {
    requireSelfUserId(ctx.session, userId);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { locale: fromLocale(locale) },
    });
    const membership = await prisma.groupMembership.findFirst({
      where: { userId },
    });
    const role = membership ? toRole(membership.role) : "operator";
    return role === "teammate" ? toTeammate(updated, role) : toUser(updated, role);
  }

  async updateName(userId: string, name: string, ctx: { session: Session }) {
    requireSelfUserId(ctx.session, userId);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
    });
    const membership = await prisma.groupMembership.findFirst({
      where: { userId },
    });
    const role = membership ? toRole(membership.role) : "operator";
    return role === "teammate" ? toTeammate(updated, role) : toUser(updated, role);
  }

  async regenerateTelegramLink(
    userId: string,
    ctx: { session: Session },
  ): Promise<string> {
    requireSelfUserId(ctx.session, userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.active) throw new Error("User not found");

    await prisma.user.update({
      where: { id: userId },
      data: { telegramChatId: null },
    });
    await prisma.telegramLinkToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    const token = await createTelegramLinkTokenRecord(userId);
    void writeAuditFromSession(ctx.session, "telegram_link", { rotated: true });
    return token;
  }

  async getTelegramLinkToken(
    userId: string,
    ctx: { session: Session },
  ): Promise<string | null> {
    requireSelfUserId(ctx.session, userId);
    const active = await prisma.telegramLinkToken.findFirst({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    });
    // ponytail: hash-only storage — can't reshow an existing code; rotate so Profile always has a link
    if (active) {
      await prisma.telegramLinkToken.update({
        where: { id: active.id },
        data: { usedAt: new Date() },
      });
    }
    const token = await createTelegramLinkTokenRecord(userId);
    void writeAuditFromSession(ctx.session, "telegram_link", { rotated: true });
    return token;
  }
}

export const apiTeammateService = new ApiTeammateService();
export const apiUserService = new ApiUserService();
