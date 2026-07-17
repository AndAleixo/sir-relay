import { defaultLocale } from "@/i18n/config";
import type { Locale, Session, Teammate, User } from "@/domain/types";
import type {
  CreateTeammateInput,
  CreateTeammateResult,
  OrganizationUser,
  TeammateService,
  UserService,
} from "@/services/contracts";
import {
  findAnyMockUserByEmail,
  findMockUserById,
  patchMockUser,
} from "@/services/mock/users.mock";
import { MOCK_OPERATORS, MOCK_TEAMMATES } from "@/services/mock/data";
import {
  addGroupMember,
  removeGroupMember,
  setMemberRole,
  userIdsInGroup,
} from "@/services/mock/groups.mock";
import {
  createInviteToken,
  createTelegramLinkToken,
  getInviteTokenForUser,
  getTelegramLinkTokenForUser,
  invalidateInviteTokens,
} from "@/services/mock/tokens.mock";
import { removeMockTasksAssignedTo } from "@/services/mock/task.mock";
import { createOrRefreshMockGroupInvitation } from "@/services/mock/invitations.mock";

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
  ): Promise<CreateTeammateResult> {
    if (ctx.session.user.role !== "operator") throw new Error("Forbidden");
    const groupId = ctx.session.activeGroupId;
    if (!groupId) throw new Error("No active group");

    const email = input.email.trim().toLowerCase();
    const existing = findAnyMockUserByEmail(email);
    if (existing) {
      if (userIdsInGroup(groupId).has(existing.id)) {
        return { ok: false, reason: "already_in_group" };
      }
      if (!existing.active) return { ok: false, reason: "account_inactive" };
      if (!("accountStatus" in existing) || existing.accountStatus === "active") {
        return {
          ok: true,
          kind: "invitation",
          invitation: createOrRefreshMockGroupInvitation({
            groupId,
            invitedUserId: existing.id,
            invitedByUserId: ctx.session.user.id,
          }),
        };
      }

      addGroupMember(groupId, existing.id, "teammate");
      return {
        ok: true,
        kind: "membership",
        teammate: {
          ...existing,
          role: "teammate",
          accountStatus:
            "accountStatus" in existing && existing.accountStatus === "invited"
              ? "invited"
              : "active",
          telegramStatus: existing.telegramStatus ?? "pending",
        },
      };
    }

    const id = `user-${Date.now()}`;
    const teammate: Teammate = {
      id,
      name: input.name,
      email,
      role: "teammate",
      locale: defaultLocale,
      active: true,
      accountStatus: "invited",
      telegramStatus: "pending",
    };
    MOCK_TEAMMATES.push(teammate);
    addGroupMember(groupId, id, "teammate");
    return { ok: true, kind: "membership", teammate };
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

  async removeTeammate(id: string, ctx: { session: Session }): Promise<void> {
    requireTeammateInGroup(ctx, id);
    removeMockTasksAssignedTo(id);
    removeGroupMember(ctx.session.activeGroupId!, id);
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

  async regenerateInvite(id: string, ctx: { session: Session }): Promise<void> {
    const teammate = requireTeammateInGroup(ctx, id);
    if (teammate.accountStatus !== "invited") throw new Error("account_active");
    invalidateInviteTokens(id, ctx.session.activeGroupId!);
  }

  async getInviteToken(id: string, ctx: { session: Session }): Promise<string | null> {
    const teammate = await this.getTeammate(id, ctx);
    if (!teammate || teammate.accountStatus !== "invited") return null;
    const groupId = ctx.session.activeGroupId!;
    return getInviteTokenForUser(id, groupId) ? null : createInviteToken(id, groupId);
  }
}

export class MockUserService implements UserService {
  async updateLocale(userId: string, locale: Locale): Promise<User> {
    const updated = patchMockUser(userId, { locale });
    if (!updated) throw new Error("User not found");
    return { ...updated };
  }

  async updateName(userId: string, name: string): Promise<User> {
    const updated = patchMockUser(userId, { name: name.trim() });
    if (!updated) throw new Error("User not found");
    return { ...updated };
  }

  async regenerateTelegramLink(userId: string): Promise<string> {
    const user = findMockUserById(userId);
    if (!user || !user.active) {
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
