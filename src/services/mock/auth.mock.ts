import { cookies } from "next/headers";
import type { Session, User } from "@/domain/types";
import type { Locale } from "@/domain/types";
import { defaultLocale } from "@/i18n/config";
import { hydrateSession } from "@/lib/session-hydrate";
import type { AuthService } from "@/services/contracts";
import {
  findMockUserByEmail,
  findMockUserById,
  patchMockUser,
  registerDynamicUser,
} from "@/services/mock/users.mock";
import { mockGroupMembershipLookup, rememberMockLastActiveGroup } from "@/services/mock/groups.mock";
import { consumeInvite, resolveInvite } from "@/services/mock/tokens.mock";

const MOCK_SESSION_COOKIE = "sirrelay_mock_session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

function readSession(): Session | null {
  const raw = cookies().get(MOCK_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    const fresh = findMockUserById(parsed.user.id);
    if (!fresh) return null;
    return hydrateSession(
      {
        user: { ...fresh },
        activeGroupId: parsed.activeGroupId ?? null,
      },
      mockGroupMembershipLookup,
      { autoPickGroup: false },
    );
  } catch {
    return null;
  }
}

function writeSession(
  session: Session | null,
  options: { autoPickGroup?: boolean } = {},
) {
  const jar = cookies();
  if (!session) {
    jar.delete(MOCK_SESSION_COOKIE);
    return;
  }
  const hydrated = hydrateSession(session, mockGroupMembershipLookup, options);
  if (!hydrated) {
    jar.delete(MOCK_SESSION_COOKIE);
    return;
  }
  jar.set(MOCK_SESSION_COOKIE, JSON.stringify(hydrated), cookieOptions);
}

function patchUser(userId: string, patch: Partial<User>) {
  return patchMockUser(userId, patch);
}

function buildSession(user: User, activeGroupId: string | null = null): Session {
  return hydrateSession(
    { user: { ...user }, activeGroupId },
    mockGroupMembershipLookup,
    { autoPickGroup: true },
  )!;
}

export class MockAuthService implements AuthService {
  async getSession(): Promise<Session | null> {
    return readSession();
  }

  async login(email: string, password: string): Promise<Session> {
    if (!email.trim() || !password) {
      throw new Error("Invalid credentials");
    }

    const user = findMockUserByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const session = buildSession(user);
    writeSession(session);
    return session;
  }

  async signup(
    name: string,
    email: string,
    password: string,
    locale: Locale = defaultLocale,
  ): Promise<Session> {
    if (!name.trim() || !email.trim() || password.length < 8) {
      throw new Error("Invalid signup");
    }
    if (findMockUserByEmail(email)) {
      throw new Error("Email taken");
    }

    const user: User = {
      id: `user-${Date.now().toString(36)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: "operator",
      locale,
      active: true,
      mustChangePassword: false,
    };
    registerDynamicUser(user);

    const session: Session = { user: { ...user }, activeGroupId: null };
    writeSession(session, { autoPickGroup: false });
    return hydrateSession(session, mockGroupMembershipLookup, { autoPickGroup: false })!;
  }

  async logout(): Promise<void> {
    writeSession(null);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<User> {
    const user = findMockUserById(userId);
    if (!user || !user.active) {
      throw new Error("User not found");
    }

    const firstLogin = Boolean(user.mustChangePassword);
    if (!firstLogin && !currentPassword) {
      throw new Error("Invalid password");
    }
    if (newPassword.length < 8) {
      throw new Error("Invalid password");
    }

    const updated = patchUser(userId, { mustChangePassword: false });
    if (!updated) throw new Error("User not found");

    const current = readSession();
    writeSession(
      buildSession(updated, current?.activeGroupId ?? null),
    );
    return { ...updated };
  }

  async joinWithToken(
    token: string,
    password: string,
    locale: Locale = defaultLocale,
  ): Promise<Session> {
    if (password.length < 8) {
      throw new Error("Invalid password");
    }

    const invite = resolveInvite(token);
    if (!invite) {
      throw new Error("Invalid token");
    }

    const user = findMockUserById(invite.userId);
    if (
      !user ||
      !user.active ||
      !("accountStatus" in user) ||
      user.accountStatus !== "invited"
    ) {
      throw new Error("Invalid token");
    }

    consumeInvite(token);
    (user as { accountStatus: string }).accountStatus = "active";
    user.locale = locale;

    const session = buildSession(
      { ...user, mustChangePassword: false },
      invite.groupId,
    );
    writeSession(session);
    return session;
  }

  async setActiveGroup(userId: string, groupId: string | null): Promise<Session> {
    const user = findMockUserById(userId);
    if (!user) throw new Error("User not found");

    if (groupId && !mockGroupMembershipLookup.hasMembership(userId, groupId)) {
      throw new Error("Invalid group");
    }

    if (groupId) {
      rememberMockLastActiveGroup(userId, groupId);
    }

    const session = hydrateSession(
      {
        user: { ...user },
        activeGroupId: groupId,
      },
      mockGroupMembershipLookup,
      { autoPickGroup: false },
    );
    if (!session) throw new Error("Invalid session");
    writeSession(session, { autoPickGroup: false });
    return session;
  }

  async refreshSessionUser(user: User): Promise<void> {
    const current = readSession();
    writeSession(
      hydrateSession(
        {
          user,
          activeGroupId: current?.activeGroupId ?? null,
        },
        mockGroupMembershipLookup,
        { autoPickGroup: false },
      ),
    );
  }

  async isInviteTokenValid(token: string): Promise<boolean> {
    return Boolean(resolveInvite(token));
  }
}

export const mockAuthService = new MockAuthService();
