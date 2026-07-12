import type { Locale, Session, Teammate, User } from "@/domain/types";
import type {
  CreateTeammateInput,
  OrganizationUser,
  TeammateService,
  UserService,
} from "@/services/contracts";
import { patchMockUser, findMockUserById, findMockUserByEmail } from "@/services/mock/users.mock";
import { MOCK_OPERATORS, MOCK_TEAMMATES } from "@/services/mock/data";
import { addGroupMember, setMemberRole, userIdsInGroup } from "@/services/mock/groups.mock";
import {
  createInviteToken,
  createTelegramLinkToken,
  getInviteTokenForUser,
  getTelegramLinkTokenForUser,
} from "@/services/mock/tokens.mock";

function requireTeammateInGroup(
  ctx: { session: Session },
  id: string,
): Teammate {
  const groupId = ctx.session.activeGroupId;
  if (!groupId || !userIdsInGroup(groupId).has(id)) {
    throw new Error("Teammate not found");
  }
  const teammate = MOCK_TEAMMATES.find((t) => t.id === id);
  if (!teammate) throw new Error("Teammate not found");
  return teammate;
}

export class MockTeammateService implements TeammateService {
  async listTeammates(ctx: { session: Session }) {
    const groupId = ctx.session.activeGroupId;
    if (!groupId) return [];
    const ids = userIdsInGroup(groupId);
    return MOCK_TEAMMATES.filter((t) => t.active && ids.has(t.id));
  }

  async listOrganizationUsers(ctx: { session: Session }): Promise<OrganizationUser[]> {
    const groupId = ctx.session.activeGroupId;
    if (!groupId) return [];
    const ids = userIdsInGroup(groupId);
    const operators = MOCK_OPERATORS.filter(
      (user) => user.active && ids.has(user.id),
    ) as OrganizationUser[];
    const teammates = MOCK_TEAMMATES.filter(
      (user) => user.active && ids.has(user.id),
    );
    return [...operators, ...teammates];
  }

  async getTeammate(id: string, ctx: { session: Session }) {
    try {
      return requireTeammateInGroup(ctx, id);
    } catch {
      return null;
    }
  }

  async createTeammate(
    input: CreateTeammateInput,
    ctx: { session: Session },
  ): Promise<Teammate> {
    const groupId = ctx.session.activeGroupId;
    if (!groupId) throw new Error("No active group");

    const email = input.email.trim().toLowerCase();
    const existing = findMockUserByEmail(email);
    if (existing) {
      if (userIdsInGroup(groupId).has(existing.id)) {
        throw new Error("Already in group");
      }
      addGroupMember(groupId, existing.id, "teammate");
      return {
        ...existing,
        role: "teammate",
        accountStatus: "active",
        telegramStatus: existing.telegramStatus ?? "pending",
      };
    }

    const id = `user-${Date.now()}`;
    const teammate: Teammate = {
      id,
      name: input.name,
      email,
      role: "teammate",
      locale: input.locale,
      active: true,
      accountStatus: "invited",
      telegramStatus: "pending",
    };
    MOCK_TEAMMATES.push(teammate);
    addGroupMember(groupId, id, "teammate");
    createInviteToken(id, groupId);
    createTelegramLinkToken(id);
    return teammate;
  }

  async updateTeammate(
    id: string,
    input: { name?: string; email?: string },
    ctx: { session: Session },
  ): Promise<Teammate> {
    const teammate = requireTeammateInGroup(ctx, id);

    if (input.name?.trim()) {
      teammate.name = input.name.trim();
    }

    if (input.email?.trim()) {
      if (teammate.accountStatus !== "invited") {
        throw new Error("Email can only change before first login");
      }
      teammate.email = input.email.trim().toLowerCase();
    }

    return { ...teammate };
  }

  async deactivateTeammate(id: string, ctx: { session: Session }): Promise<Teammate> {
    const teammate = requireTeammateInGroup(ctx, id);
    teammate.active = false;
    return { ...teammate };
  }

  async promoteToOperator(id: string, ctx: { session: Session }): Promise<void> {
    const teammate = requireTeammateInGroup(ctx, id);
    const groupId = ctx.session.activeGroupId;
    if (!groupId) throw new Error("No active group");
    if (ctx.session.user.role !== "operator") throw new Error("Forbidden");
    if (!teammate.active) throw new Error("Inactive user");
    if (teammate.accountStatus !== "active") throw new Error("Account not active");
    setMemberRole(groupId, id, "operator");
  }

  async regenerateInvite(id: string, ctx: { session: Session }): Promise<string> {
    requireTeammateInGroup(ctx, id);
    return createInviteToken(id, ctx.session.activeGroupId!);
  }

  async regenerateTelegramLink(id: string, ctx: { session: Session }): Promise<string> {
    const teammate = requireTeammateInGroup(ctx, id);
    teammate.telegramStatus = "pending";
    return createTelegramLinkToken(id);
  }

  async getInviteToken(id: string, ctx: { session: Session }): Promise<string | null> {
    if (!(await this.getTeammate(id, ctx))) return null;
    return getInviteTokenForUser(id) ?? createInviteToken(id, ctx.session.activeGroupId!);
  }

  async getTelegramLinkToken(id: string, ctx: { session: Session }): Promise<string | null> {
    if (!(await this.getTeammate(id, ctx))) return null;
    return getTelegramLinkTokenForUser(id) ?? createTelegramLinkToken(id);
  }
}

export class MockUserService implements UserService {
  async updateLocale(userId: string, locale: Locale): Promise<User> {
    const updated = patchMockUser(userId, { locale });
    if (!updated) throw new Error("User not found");
    return { ...updated };
  }

  async regenerateTelegramLink(userId: string): Promise<string> {
    const user = findMockUserById(userId);
    if (!user || user.role !== "operator") {
      throw new Error("User not found");
    }
    patchMockUser(userId, { telegramStatus: "pending" });
    return createTelegramLinkToken(userId);
  }

  async getTelegramLinkToken(userId: string): Promise<string | null> {
    return getTelegramLinkTokenForUser(userId) ?? createTelegramLinkToken(userId);
  }
}

export const mockTeammateService = new MockTeammateService();
export const mockUserService = new MockUserService();
