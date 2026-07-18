import type { Locale, Session, User } from "@/domain/types";
import { defaultLocale } from "@/i18n/config";
import type { AuthService } from "@/services/contracts";
import { hashPassword, verifyPassword } from "@/lib/password";
import { assertPasswordForSet } from "@/lib/password-policy";
import { isLoginLocked, nextFailedLoginState } from "@/lib/login-lockout";
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
import { toTeammate, toUser, fromLocale } from "@/services/api/mappers";

type HydrateOptions = { autoPickGroup?: boolean };

async function loadDbUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

function payloadFor(
  userId: string,
  activeGroupId: string | null,
  tokenVersion: number,
): SessionPayload {
  return { userId, activeGroupId, tokenVersion };
}

async function hydrateFromPayload(
  payload: SessionPayload,
  options: HydrateOptions = {},
): Promise<Session | null> {
  const row = await loadDbUser(payload.userId);
  if (!row || !row.active) return null;
  if (payload.tokenVersion !== row.tokenVersion) return null;

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
  userId: string,
  activeGroupId: string | null,
  tokenVersion: number,
  options: HydrateOptions = {},
): Promise<Session> {
  const payload = payloadFor(userId, activeGroupId, tokenVersion);
  const session = await hydrateFromPayload(payload, options);
  if (!session) throw new Error("Invalid session");
  await writeSessionPayload(payload);
  return session;
}

async function recordLoginFailure(userId: string, failedLoginCount: number) {
  const next = nextFailedLoginState(failedLoginCount);
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: next.failedLoginCount,
      lockedUntil: next.lockedUntil,
    },
  });
}

async function clearLoginFailures(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null },
  });
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
    if (!row) throw new Error("Invalid credentials");

    if (isLoginLocked(row.lockedUntil)) {
      throw new Error("Invalid credentials");
    }

    if (!(await verifyPassword(password, row.passwordHash))) {
      await recordLoginFailure(row.id, row.failedLoginCount);
      throw new Error("Invalid credentials");
    }

    await clearLoginFailures(row.id);

    const activeGroupId = await pickDefaultGroupIdAsync(row.id);
    return persistSession(row.id, activeGroupId, row.tokenVersion, {
      autoPickGroup: true,
    });
  }

  async signup(
    name: string,
    email: string,
    password: string,
    locale: Locale = defaultLocale,
  ): Promise<Session> {
    if (!name.trim() || !email.trim()) {
      throw new Error("Invalid signup");
    }
    assertPasswordForSet(password);

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
        locale: fromLocale(locale),
        accountStatus: "active",
      },
    });

    return persistSession(id, null, 0, { autoPickGroup: false });
  }

  async logout(): Promise<void> {
    const payload = await readSessionPayload();
    if (payload) {
      await prisma.user.update({
        where: { id: payload.userId },
        data: { tokenVersion: { increment: 1 } },
      });
    }
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
    assertPasswordForSet(newPassword);

    if (!firstLogin && !(await verifyPassword(currentPassword, row.passwordHash))) {
      throw new Error("Invalid password");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(newPassword),
        mustChangePassword: false,
        tokenVersion: { increment: 1 },
      },
    });

    const payload = await readSessionPayload();
    if (payload?.userId === userId) {
      await writeSessionPayload(
        payloadFor(userId, payload.activeGroupId, updated.tokenVersion),
      );
    }

    const role = payload?.activeGroupId
      ? await roleInGroupAsync(userId, payload.activeGroupId)
      : null;
    return role === "teammate"
      ? toTeammate(updated, role)
      : toUser(updated, role ?? "operator");
  }

  async joinWithToken(
    token: string,
    password: string,
    locale: Locale = defaultLocale,
    name?: string,
  ): Promise<Session> {
    assertPasswordForSet(password);
    const trimmedName = name?.trim() ?? "";
    if (trimmedName.length < 2) throw new Error("Invalid name");

    const tokenHash = hashToken(token);
    const passwordHash = await hashPassword(password);
    const invite = await prisma.$transaction(async (tx) => {
      const candidate = await tx.teammateInviteToken.findFirst({
        where: { tokenHash },
      });
      if (!candidate) throw new Error("Invalid token");

      const claimed = await tx.teammateInviteToken.updateMany({
        where: {
          id: candidate.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) throw new Error("Invalid token");

      const user = await tx.user.findUnique({
        where: { id: candidate.userId },
        select: { active: true, accountStatus: true },
      });
      if (!user?.active || user.accountStatus !== "invited") {
        throw new Error("Invalid token");
      }

      await tx.user.update({
        where: { id: candidate.userId },
        data: {
          name: trimmedName,
          passwordHash,
          accountStatus: "active",
          mustChangePassword: false,
          locale: fromLocale(locale),
        },
      });
      return candidate;
    });

    const row = await loadDbUser(invite.userId);
    if (!row) throw new Error("Invalid token");

    return persistSession(invite.userId, invite.groupId, row.tokenVersion, {
      autoPickGroup: false,
    });
  }

  async setActiveGroup(userId: string, groupId: string | null): Promise<Session> {
    const row = await loadDbUser(userId);
    if (!row) throw new Error("User not found");

    if (groupId && !(await hasMembershipAsync(userId, groupId))) {
      throw new Error("Invalid group");
    }

    if (groupId) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastActiveGroupId: groupId },
      });
    }

    return persistSession(userId, groupId, row.tokenVersion, {
      autoPickGroup: false,
    });
  }

  async refreshSessionUser(user: User): Promise<void> {
    const payload = await readSessionPayload();
    if (!payload || payload.userId !== user.id) return;
    const row = await loadDbUser(user.id);
    if (!row) return;
    await writeSessionPayload(
      payloadFor(user.id, payload.activeGroupId, row.tokenVersion),
    );
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
