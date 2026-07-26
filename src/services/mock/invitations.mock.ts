import { randomBytes } from "crypto";
import type { GroupInvitation } from "@/domain/types";
import type { GroupInvitationService } from "@/services/contracts";
import {
  addGroupMember,
  getGroup,
  mockGroupMembershipLookup,
} from "@/services/mock/groups.mock";
import { findMockUserById } from "@/services/mock/users.mock";

const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

type MockInvitation = GroupInvitation & {
  invitedByUserId: string;
  storedStatus: "pending" | "accepted" | "declined";
};

function invitationStore(): MockInvitation[] {
  const key = "__sirrelay_mock_group_invitations__";
  const global = globalThis as typeof globalThis & {
    [key: string]: MockInvitation[] | undefined;
  };
  if (!global[key]) global[key] = [];
  return global[key];
}

function publicInvitation(invitation: MockInvitation): GroupInvitation {
  return {
    id: invitation.id,
    groupId: invitation.groupId,
    groupName: invitation.groupName,
    invitedUserId: invitation.invitedUserId,
    invitedUserName: invitation.invitedUserName,
    invitedUserEmail: invitation.invitedUserEmail,
    role: "teammate",
    status:
      invitation.storedStatus === "pending" &&
      new Date(invitation.expiresAt) <= new Date()
        ? "expired"
        : invitation.storedStatus === "declined"
          ? "declined"
          : "pending",
    expiresAt: invitation.expiresAt,
  };
}

export function createOrRefreshMockGroupInvitation(input: {
  groupId: string;
  invitedUserId: string;
  invitedByUserId: string;
}): GroupInvitation {
  const group = getGroup(input.groupId);
  const user = findMockUserById(input.invitedUserId);
  if (!group || !user) throw new Error("invitation_invalid");
  if (
    mockGroupMembershipLookup.roleInGroup(
      input.invitedByUserId,
      input.groupId,
    ) !== "operator"
  ) {
    throw new Error("forbidden");
  }
  if (!user.active || ("accountStatus" in user && user.accountStatus !== "active")) {
    throw new Error("account_inactive");
  }
  if (
    mockGroupMembershipLookup.hasMembership(
      input.invitedUserId,
      input.groupId,
    )
  ) {
    throw new Error("already_in_group");
  }

  const store = invitationStore();
  const existing = store.find(
    (row) =>
      row.groupId === input.groupId &&
      row.invitedUserId === input.invitedUserId,
  );
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS).toISOString();
  if (existing) {
    Object.assign(existing, {
      invitedByUserId: input.invitedByUserId,
      storedStatus: "pending",
      status: "pending",
      expiresAt,
    });
    return publicInvitation(existing);
  }

  const invitation: MockInvitation = {
    id: `group-invitation-${randomBytes(6).toString("base64url")}`,
    groupId: group.id,
    groupName: group.name,
    invitedUserId: user.id,
    invitedUserName: user.name.trim() || user.email,
    invitedUserEmail: user.email,
    invitedByUserId: input.invitedByUserId,
    role: "teammate",
    status: "pending",
    storedStatus: "pending",
    expiresAt,
  };
  store.push(invitation);
  return publicInvitation(invitation);
}

export class MockGroupInvitationService implements GroupInvitationService {
  async listForUser(userId: string): Promise<GroupInvitation[]> {
    return invitationStore()
      .filter(
        (row) =>
          row.invitedUserId === userId &&
          row.storedStatus === "pending" &&
          new Date(row.expiresAt) > new Date(),
      )
      .map(publicInvitation);
  }

  async listForGroup(
    ctx: Parameters<GroupInvitationService["listForGroup"]>[0],
  ): Promise<GroupInvitation[]> {
    const groupId = ctx.session.activeGroupId;
    if (!groupId || ctx.session.user.role !== "operator") throw new Error("forbidden");
    if (
      mockGroupMembershipLookup.roleInGroup(
        ctx.session.user.id,
        groupId,
      ) !== "operator"
    ) {
      throw new Error("forbidden");
    }
    return invitationStore()
      .filter((row) => row.groupId === groupId && row.storedStatus !== "accepted")
      .map(publicInvitation);
  }

  async accept(invitationId: string, userId: string) {
    const invitation = invitationStore().find((row) => row.id === invitationId);
    if (
      !invitation ||
      invitation.invitedUserId !== userId ||
      invitation.storedStatus !== "pending" ||
      new Date(invitation.expiresAt) <= new Date()
    ) {
      throw new Error("invitation_invalid");
    }
    addGroupMember(invitation.groupId, userId, invitation.role);
    invitation.storedStatus = "accepted";
    const group = getGroup(invitation.groupId);
    if (!group) throw new Error("invitation_invalid");
    return group;
  }

  async decline(invitationId: string, userId: string): Promise<void> {
    const invitation = invitationStore().find((row) => row.id === invitationId);
    if (
      !invitation ||
      invitation.invitedUserId !== userId ||
      invitation.storedStatus !== "pending" ||
      new Date(invitation.expiresAt) <= new Date()
    ) {
      throw new Error("invitation_invalid");
    }
    invitation.storedStatus = "declined";
  }

  async resend(
    invitationId: string,
    ctx: Parameters<GroupInvitationService["resend"]>[1],
  ): Promise<GroupInvitation> {
    const invitation = invitationStore().find((row) => row.id === invitationId);
    if (
      !invitation ||
      invitation.groupId !== ctx.session.activeGroupId ||
      ctx.session.user.role !== "operator"
    ) {
      throw new Error("invitation_not_found");
    }
    return createOrRefreshMockGroupInvitation({
      groupId: invitation.groupId,
      invitedUserId: invitation.invitedUserId,
      invitedByUserId: ctx.session.user.id,
    });
  }
}

export const mockGroupInvitationService = new MockGroupInvitationService();
