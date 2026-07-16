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
import { prisma } from "@/lib/prisma";
import {
  createInviteTokenRecord,
  createTelegramLinkTokenRecord,
} from "@/services/api/groups";
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

async function requireTeammateInGroup(
  ctx: { session: Session },
  id: string,
): Promise<Teammate> {
  const groupId = requireGroupId(ctx.session);
  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: id } },
    include: { user: true },
  });
  if (!membership || membership.role !== "teammate") {
    throw new Error("Teammate not found");
  }
  return toTeammate(membership.user, toRole(membership.role));
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
      .map((row) => toTeammate(row.user, "teammate"));
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
          ? toTeammate(row.user, role)
          : (toUser(row.user, role) as OrganizationUser);
      });
  }

  async getTeammate(id: string, ctx: { session: Session }): Promise<Teammate | null> {
    try {
      return await requireTeammateInGroup(ctx, id);
    } catch {
      return null;
    }
  }

  async createTeammate(
    input: CreateTeammateInput,
    ctx: { session: Session },
  ): Promise<CreateTeammateResult> {
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

      try {
        await prisma.$transaction(async (tx) => {
          await tx.groupMembership.create({
            data: { groupId, userId: existing.id, role: "teammate" },
          });
        });
        return { ok: true as const, teammate: toTeammate(existing, "teammate") };
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
            name: input.name.trim(),
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
      return { ok: true as const, teammate: toTeammate(user, "teammate") };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return this.createTeammate(input, ctx);
      }
      throw error;
    }
  }

  async updateTeammate(
    id: string,
    input: { name?: string; email?: string },
    ctx: { session: Session },
  ): Promise<Teammate> {
    const teammate = await requireTeammateInGroup(ctx, id);
    const data: { name?: string; email?: string } = {};

    if (input.name?.trim()) data.name = input.name.trim();
    if (input.email?.trim()) {
      if (teammate.accountStatus !== "invited") {
        throw new Error("Email can only change before first login");
      }
      data.email = input.email.trim().toLowerCase();
    }

    const updated = await prisma.user.update({ where: { id }, data });
    return toTeammate(updated, "teammate");
  }

  async removeTeammate(id: string, ctx: { session: Session }): Promise<void> {
    await requireTeammateInGroup(ctx, id);
    const groupId = requireGroupId(ctx.session);
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
  }

  async regenerateInvite(id: string, ctx: { session: Session }): Promise<void> {
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
  }

  async getInviteToken(id: string, ctx: { session: Session }): Promise<string | null> {
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
  async updateLocale(userId: string, locale: Locale) {
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

  async updateName(userId: string, name: string) {
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

  async regenerateTelegramLink(userId: string): Promise<string> {
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
    return createTelegramLinkTokenRecord(userId);
  }

  async getTelegramLinkToken(userId: string): Promise<string | null> {
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
    return createTelegramLinkTokenRecord(userId);
  }
}

export const apiTeammateService = new ApiTeammateService();
export const apiUserService = new ApiUserService();
