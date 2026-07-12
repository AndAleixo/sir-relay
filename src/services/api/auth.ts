import type { Locale, Session, User } from "@/domain/types";
import type { AuthService } from "@/services/contracts";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  readSessionPayload,
  writeSessionPayload,
  type SessionPayload,
} from "@/lib/session-cookie";
import { hashToken } from "@/lib/token-hash";
import {
  hasMembershipAsync,
  pickDefaultGroupIdAsync,
  roleInGroupAsync,
} from "@/services/api/membership";
import { toTeammate, toUser } from "@/services/api/mappers";

type HydrateOptions = { autoPickGroup?: boolean };

async function loadDbUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

async function hydrateFromPayload(
  payload: SessionPayload,
  options: HydrateOptions = {},
): Promise<Session | null> {
  const row = await loadDbUser(payload.userId);
  if (!row || !row.active) return null;

  const autoPick = options.autoPickGroup !== false;
  let activeGroupId = payload.activeGroupId;
  if (!activeGroupId && autoPick) {
    activeGroupId = await pickDefaultGroupIdAsync(row.id);
  }

  if (!activeGroupId) {
    return { user: toUser(row), activeGroupId: null };
  }

  const role = await roleInGroupAsync(row.id, activeGroupId);
  if (!role || !(await hasMembershipAsync(row.id, activeGroupId))) {
    return { user: toUser(row), activeGroupId: null };
  }

  const user = role === "teammate" ? toTeammate(row, role) : toUser(row, role);
  return { user, activeGroupId };
}

async function persistSession(
  payload: SessionPayload,
  options: HydrateOptions = {},
): Promise<Session> {
  const session = await hydrateFromPayload(payload, options);
  if (!session) throw new Error("Invalid session");
  await writeSessionPayload(payload);
  return session;
}

export class ApiAuthService implements AuthService {
  async getSession(): Promise<Session | null> {
    const payload = await readSessionPayload();
    if (!payload) return null;
    return hydrateFromPayload(payload, { autoPickGroup: false });
  }

  async login(email: string, password: string): Promise<Session> {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) throw new Error("Invalid credentials");

    const row = await prisma.user.findFirst({
      where: { email: normalized, active: true },
    });
    if (!row || !(await verifyPassword(password, row.passwordHash))) {
      throw new Error("Invalid credentials");
    }

    let activeGroupId = await pickDefaultGroupIdAsync(row.id);
    return persistSession({ userId: row.id, activeGroupId }, { autoPickGroup: true });
  }

  async signup(
    name: string,
    email: string,
    password: string,
    locale: Locale = "en",
  ): Promise<Session> {
    if (!name.trim() || !email.trim() || password.length < 8) {
      throw new Error("Invalid signup");
    }
    const normalized = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalized } });
    if (existing) throw new Error("Email taken");

    const passwordHash = await hashPassword(password);
    const id = `user-${Date.now().toString(36)}`;
    await prisma.user.create({
      data: {
        id,
        name: name.trim(),
        email: normalized,
        passwordHash,
        locale,
        accountStatus: "active",
      },
    });

    return persistSession(
      { userId: id, activeGroupId: null },
      { autoPickGroup: false },
    );
  }

  async logout(): Promise<void> {
    await writeSessionPayload(null);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<User> {
    const row = await loadDbUser(userId);
    if (!row || !row.active) throw new Error("User not found");

    const firstLogin = row.mustChangePassword;
    if (!firstLogin && !currentPassword) throw new Error("Invalid password");
    if (newPassword.length < 8) throw new Error("Invalid password");

    if (!firstLogin && !(await verifyPassword(currentPassword, row.passwordHash))) {
      throw new Error("Invalid password");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(newPassword),
        mustChangePassword: false,
      },
    });

    const payload = await readSessionPayload();
    if (payload?.userId === userId) {
      await writeSessionPayload(payload);
    }

    const role = payload?.activeGroupId
      ? await roleInGroupAsync(userId, payload.activeGroupId)
      : null;
    return role === "teammate"
      ? toTeammate(updated, role)
      : toUser(updated, role ?? "operator");
  }

  async joinWithToken(token: string, password: string): Promise<Session> {
    if (password.length < 8) throw new Error("Invalid password");

    const tokenHash = hashToken(token);
    const invite = await prisma.teammateInviteToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!invite) throw new Error("Invalid token");

    const row = await loadDbUser(invite.userId);
    if (!row || !row.active) throw new Error("Invalid token");

    await prisma.$transaction([
      prisma.user.update({
        where: { id: invite.userId },
        data: {
          passwordHash: await hashPassword(password),
          accountStatus: "active",
          mustChangePassword: false,
        },
      }),
      prisma.teammateInviteToken.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return persistSession(
      { userId: invite.userId, activeGroupId: invite.groupId },
      { autoPickGroup: false },
    );
  }

  async setActiveGroup(userId: string, groupId: string | null): Promise<Session> {
    const row = await loadDbUser(userId);
    if (!row) throw new Error("User not found");

    if (groupId && !(await hasMembershipAsync(userId, groupId))) {
      throw new Error("Invalid group");
    }

    return persistSession({ userId, activeGroupId: groupId }, { autoPickGroup: false });
  }

  async refreshSessionUser(user: User): Promise<void> {
    const payload = await readSessionPayload();
    if (!payload || payload.userId !== user.id) return;
    await writeSessionPayload(payload);
  }

  async isInviteTokenValid(token: string): Promise<boolean> {
    const tokenHash = hashToken(token);
    const invite = await prisma.teammateInviteToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    return Boolean(invite);
  }
}

export const apiAuthService = new ApiAuthService();
