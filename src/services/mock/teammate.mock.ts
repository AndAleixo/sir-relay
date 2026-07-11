import type { Locale, Role, Teammate, User } from "@/domain/types";
import type {
  CreateTeammateInput,
  OrganizationUser,
  TeammateService,
  UserService,
} from "@/services/contracts";
import { MOCK_OPERATORS, MOCK_TEAMMATES } from "@/services/mock/data";
import { addGroupMember, userIdsInGroup } from "@/services/mock/groups.mock";
import {
  createInviteToken,
  createTelegramLinkToken,
  getInviteTokenForUser,
  getTelegramLinkTokenForUser,
} from "@/services/mock/tokens.mock";

function memberIdsForGroup(groupId: string): Set<string> {
  return userIdsInGroup(groupId);
}

export class MockTeammateService implements TeammateService {
  async listTeammates(ctx: { session: { activeGroupId: string | null } }) {
    const groupId = ctx.session.activeGroupId;
    if (!groupId) return [];
    const ids = memberIdsForGroup(groupId);
    return MOCK_TEAMMATES.filter((t) => t.active && ids.has(t.id));
  }

  async listOrganizationUsers(ctx: {
    session: { activeGroupId: string | null };
  }): Promise<OrganizationUser[]> {
    const groupId = ctx.session.activeGroupId;
    if (!groupId) return [];
    const ids = memberIdsForGroup(groupId);
    const operators = MOCK_OPERATORS.filter(
      (user) => user.active && ids.has(user.id),
    ) as OrganizationUser[];
    const teammates = MOCK_TEAMMATES.filter(
      (user) => user.active && ids.has(user.id),
    );
    return [...operators, ...teammates];
  }

  async getTeammate(id: string) {
    return MOCK_TEAMMATES.find((t) => t.id === id) ?? null;
  }

  async createTeammate(
    input: CreateTeammateInput,
    ctx: { session: { activeGroupId: string | null } },
  ): Promise<Teammate> {
    const groupId = ctx.session.activeGroupId;
    if (!groupId) throw new Error("No active group");

    const id = `user-${Date.now()}`;
    const teammate: Teammate = {
      id,
      name: input.name,
      email: input.email.toLowerCase(),
      role: "teammate",
      locale: input.locale,
      active: true,
      accountStatus: "invited",
      telegramStatus: "pending",
    };
    MOCK_TEAMMATES.push(teammate);
    addGroupMember(groupId, id, "teammate" satisfies Role);
    createInviteToken(id);
    createTelegramLinkToken(id);
    return teammate;
  }

  async updateTeammate(
    id: string,
    input: { name?: string; email?: string },
  ): Promise<Teammate> {
    const teammate = MOCK_TEAMMATES.find((user) => user.id === id);
    if (!teammate) throw new Error("Teammate not found");

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

  async deactivateTeammate(id: string): Promise<Teammate> {
    const teammate = MOCK_TEAMMATES.find((user) => user.id === id);
    if (!teammate) throw new Error("Teammate not found");
    teammate.active = false;
    return { ...teammate };
  }

  async regenerateInvite(id: string): Promise<string> {
    const teammate = MOCK_TEAMMATES.find((user) => user.id === id);
    if (!teammate) throw new Error("Teammate not found");
    return createInviteToken(id);
  }

  async regenerateTelegramLink(id: string): Promise<string> {
    const teammate = MOCK_TEAMMATES.find((user) => user.id === id);
    if (!teammate) throw new Error("Teammate not found");
    teammate.telegramStatus = "pending";
    return createTelegramLinkToken(id);
  }

  async getInviteToken(id: string): Promise<string | null> {
    return getInviteTokenForUser(id) ?? createInviteToken(id);
  }

  async getTelegramLinkToken(id: string): Promise<string | null> {
    return getTelegramLinkTokenForUser(id) ?? createTelegramLinkToken(id);
  }
}

export class MockUserService implements UserService {
  async updateLocale(userId: string, locale: Locale): Promise<User> {
    const operator = MOCK_OPERATORS.find((user) => user.id === userId);
    if (operator) {
      operator.locale = locale;
      return { ...operator };
    }

    const teammate = MOCK_TEAMMATES.find((t) => t.id === userId);
    if (teammate) {
      teammate.locale = locale;
      return { ...teammate };
    }

    throw new Error("User not found");
  }

  async regenerateTelegramLink(userId: string): Promise<string> {
    const operator = MOCK_OPERATORS.find((user) => user.id === userId);
    if (operator) {
      operator.telegramStatus = "pending";
      return createTelegramLinkToken(userId);
    }
    throw new Error("User not found");
  }

  async getTelegramLinkToken(userId: string): Promise<string | null> {
    return getTelegramLinkTokenForUser(userId) ?? createTelegramLinkToken(userId);
  }
}

export const mockTeammateService = new MockTeammateService();
export const mockUserService = new MockUserService();
