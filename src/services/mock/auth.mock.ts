import { cookies } from "next/headers";
import type { Session, User } from "@/domain/types";
import { hydrateSession } from "@/lib/session-hydrate";
import type { AuthService } from "@/services/contracts";
import {
  MOCK_OPERATORS,
  MOCK_TEAMMATES,
} from "@/services/mock/data";
import {
  mockGroupMembershipLookup,
} from "@/services/mock/groups.mock";
import { consumeInviteToken, resolveInviteToken } from "@/services/mock/tokens.mock";

const MOCK_SESSION_COOKIE = "sirrelay_mock_session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

/** ponytail: in-memory signups reset on server restart. */
const dynamicUsers: User[] = [];

function allUsers(): User[] {
  return [...MOCK_OPERATORS, ...MOCK_TEAMMATES, ...dynamicUsers];
}

function findUserByEmail(email: string): User | null {
  const normalized = email.trim().toLowerCase();
  const exact = allUsers().find(
    (user) => user.active && user.email.toLowerCase() === normalized,
  );
  if (exact) return exact;

  if (!normalized.includes("@")) {
    return (
      allUsers().find(
        (user) =>
          user.active && user.email.toLowerCase().split("@")[0] === normalized,
      ) ?? null
    );
  }

  return null;
}

function findUserById(userId: string): User | null {
  return allUsers().find((user) => user.id === userId) ?? null;
}

function readSession(): Session | null {
  const raw = cookies().get(MOCK_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    const fresh = findUserById(parsed.user.id);
    if (!fresh) return null;
    return hydrateSession(
      {
        user: { ...fresh },
        activeGroupId: parsed.activeGroupId ?? null,
      },
      mockGroupMembershipLookup,
    );
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  const jar = cookies();
  if (!session) {
    jar.delete(MOCK_SESSION_COOKIE);
    return;
  }
  const hydrated = hydrateSession(session, mockGroupMembershipLookup);
  if (!hydrated) {
    jar.delete(MOCK_SESSION_COOKIE);
    return;
  }
  jar.set(MOCK_SESSION_COOKIE, JSON.stringify(hydrated), cookieOptions);
}

function patchUser(userId: string, patch: Partial<User>) {
  const lists = [MOCK_OPERATORS, MOCK_TEAMMATES, dynamicUsers];
  for (const list of lists) {
    const user = list.find((u) => u.id === userId);
    if (user) {
      Object.assign(user, patch);
      return user;
    }
  }
  return null;
}

function buildSession(user: User, activeGroupId: string | null = null): Session {
  return hydrateSession(
    {
      user: { ...user },
      activeGroupId:
        activeGroupId ?? mockGroupMembershipLookup.pickDefaultGroupId(user.id),
    },
    mockGroupMembershipLookup,
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

    const user = findUserByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const session = buildSession(user);
    writeSession(session);
    return session;
  }

  async signup(name: string, email: string, password: string): Promise<Session> {
    if (!name.trim() || !email.trim() || password.length < 8) {
      throw new Error("Invalid signup");
    }
    if (findUserByEmail(email)) {
      throw new Error("Email taken");
    }

    const user: User = {
      id: `user-${Date.now().toString(36)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: "operator",
      locale: "en",
      active: true,
      mustChangePassword: false,
    };
    dynamicUsers.push(user);

    const session: Session = { user: { ...user }, activeGroupId: null };
    writeSession(session);
    return session;
  }

  async logout(): Promise<void> {
    writeSession(null);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<User> {
    const user = findUserById(userId);
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

  async joinWithToken(token: string, password: string): Promise<Session> {
    if (password.length < 8) {
      throw new Error("Invalid password");
    }

    const userId = consumeInviteToken(token);
    if (!userId) {
      throw new Error("Invalid token");
    }

    const user = findUserById(userId);
    if (!user || !user.active) {
      throw new Error("Invalid token");
    }

    if ("accountStatus" in user) {
      (user as { accountStatus: string }).accountStatus = "active";
    }

    const session = buildSession({ ...user, mustChangePassword: false });
    writeSession(session);
    return session;
  }

  async setActiveGroup(userId: string, groupId: string | null): Promise<Session> {
    const user = findUserById(userId);
    if (!user) throw new Error("User not found");

    const session = hydrateSession(
      {
        user: { ...user },
        activeGroupId: groupId,
      },
      mockGroupMembershipLookup,
    );
    if (!session) throw new Error("Invalid session");
    writeSession(session);
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
      ),
    );
  }

  async isInviteTokenValid(token: string): Promise<boolean> {
    return Boolean(resolveInviteToken(token));
  }
}

export const mockAuthService = new MockAuthService();
