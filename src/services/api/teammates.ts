import type { Locale, Session, Teammate } from "@/domain/types";
import type {
  CreateTeammateInput,
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

function requireGroupId(session: Session): string {
  const groupId = session.activeGroupId;
  if (!groupId) throw new Error("No active group");
  return groupId;
}

async function memberIds(groupId: string): Promise<Set<string>> {
  const rows = await prisma.groupMembership.findMany({
    where: { groupId },
    select: { userId: true },
  });
  return new Set(rows.map((row) => row.userId));
}

async function requireTeammateInGroup(
  ctx: { session: Session },
  id: string,
): Promise<Teammate> {
  const groupId = requireGroupId(ctx.session);
  const ids = await memberIds(groupId);
  if (!ids.has(id)) throw new Error("Teammate not found");

  const row = await prisma.user.findUnique({ where: { id } });
  if (!row) throw new Error("Teammate not found");

  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: id } },
  });
  if (!membership || membership.role !== "teammate") {
    throw new Error("Teammate not found");
  }
  return toTeammate(row, toRole(membership.role));
}

async function latestInviteToken(userId: string, groupId: string): Promise<string> {
  await prisma.teammateInviteToken.updateMany({
    where: { userId, groupId, usedAt: null },
    data: { usedAt: new Date() },
  });
  return createInviteTokenRecord(userId, groupId);
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
  ): Promise<Teammate> {
    const groupId = requireGroupId(ctx.session);
    const email = input.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      const member = await prisma.groupMembership.findUnique({
        where: { groupId_userId: { groupId, userId: existing.id } },
      });
      if (member) throw new Error("Already in group");

      await prisma.groupMembership.create({
        data: { groupId, userId: existing.id, role: "teammate" },
      });
      return toTeammate(existing, "teammate");
    }

    const id = `user-${Date.now().toString(36)}`;
    const user = await prisma.user.create({
      data: {
        id,
        name: input.name.trim(),
        email,
        locale: fromLocale(defaultLocale),
        accountStatus: "invited",
        active: true,
      },
    });
    await prisma.groupMembership.create({
      data: { groupId, userId: id, role: "teammate" },
    });
    await latestInviteToken(id, groupId);
    await createTelegramLinkTokenRecord(id);
    return toTeammate(user, "teammate");
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

  async deactivateTeammate(id: string, ctx: { session: Session }): Promise<Teammate> {
    await requireTeammateInGroup(ctx, id);
    const updated = await prisma.user.update({
      where: { id },
      data: { active: false },
    });
    return toTeammate(updated, "teammate");
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

  async regenerateInvite(id: string, ctx: { session: Session }): Promise<string> {
    await requireTeammateInGroup(ctx, id);
    return latestInviteToken(id, requireGroupId(ctx.session));
  }

  async regenerateTelegramLink(id: string, ctx: { session: Session }): Promise<string> {
    await requireTeammateInGroup(ctx, id);
    await prisma.user.update({
      where: { id },
      data: { telegramChatId: null },
    });
    await prisma.telegramLinkToken.updateMany({
      where: { userId: id, usedAt: null },
      data: { usedAt: new Date() },
    });
    return createTelegramLinkTokenRecord(id);
  }

  async getInviteToken(id: string, ctx: { session: Session }): Promise<string | null> {
    if (!(await this.getTeammate(id, ctx))) return null;
    return latestInviteToken(id, requireGroupId(ctx.session));
  }

  async getTelegramLinkToken(id: string, ctx: { session: Session }): Promise<string | null> {
    if (!(await this.getTeammate(id, ctx))) return null;
    const active = await prisma.telegramLinkToken.findFirst({
      where: { userId: id, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (active) {
      await prisma.telegramLinkToken.updateMany({
        where: { userId: id, usedAt: null },
        data: { usedAt: new Date() },
      });
    }
    return createTelegramLinkTokenRecord(id);
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

  async regenerateTelegramLink(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const isOperator = await prisma.groupMembership.findFirst({
      where: { userId, role: "operator" },
    });
    if (!isOperator) throw new Error("User not found");

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
    if (active) {
      await prisma.telegramLinkToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
      });
    }
    return createTelegramLinkTokenRecord(userId);
  }
}

export const apiTeammateService = new ApiTeammateService();
export const apiUserService = new ApiUserService();
