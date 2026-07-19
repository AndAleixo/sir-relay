import { cookies } from "next/headers";
import type { Session, User } from "@/domain/types";
import type { Locale } from "@/domain/types";
import { defaultLocale } from "@/i18n/config";
import { hydrateSession } from "@/lib/session-hydrate";
import { assertPasswordForSet } from "@/lib/password-policy";
import { isLoginLocked } from "@/lib/login-lockout";
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

type MockSecState = {
  tokenVersion: number;
  failedLoginCount: number;
  lockedUntil: Date | null;
};

/** ponytail: in-memory SEC state for mock — resets on process restart. */
const mockSec = new Map<string, MockSecState>();

function sec(userId: string): MockSecState {
  let state = mockSec.get(userId);
  if (!state) {
    state = { tokenVersion: 0, failedLoginCount: 0, lockedUntil: null };
    mockSec.set(userId, state);
  }
  return state;
}

type MockCookieSession = Session & { tokenVersion?: number };

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

async function readSession(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get(MOCK_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MockCookieSession;
    const fresh = findMockUserById(parsed.user.id);
    if (!fresh) return null;
    if ((parsed.tokenVersion ?? 0) !== sec(fresh.id).tokenVersion) return null;
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

async function writeSession(
  session: Session | null,
  options: { autoPickGroup?: boolean } = {},
) {
  const jar = await cookies();
  if (!session) {
    jar.delete(MOCK_SESSION_COOKIE);
    return;
  }
  const hydrated = hydrateSession(session, mockGroupMembershipLookup, options);
  if (!hydrated) {
    jar.delete(MOCK_SESSION_COOKIE);
    return;
  }
  const cookieBody: MockCookieSession = {
    ...hydrated,
    tokenVersion: sec(hydrated.user.id).tokenVersion,
  };
  jar.set(MOCK_SESSION_COOKIE, JSON.stringify(cookieBody), cookieOptions);
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

    const state = sec(user.id);
    if (isLoginLocked(state.lockedUntil)) {
      throw new Error("Invalid credentials");
    }

    // Mock: any non-empty password still works (grandfather demo UX).
    // Failed attempts only when password is empty (already rejected) — no-op here.
    state.failedLoginCount = 0;
    state.lockedUntil = null;

    const session = buildSession(user);
    await writeSession(session);
    return session;
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
    sec(user.id);

    const session: Session = { user: { ...user }, activeGroupId: null };
    await writeSession(session, { autoPickGroup: false });
    return hydrateSession(session, mockGroupMembershipLookup, { autoPickGroup: false })!;
  }

  async logout(): Promise<void> {
    const current = await readSession();
    if (current) {
      sec(current.user.id).tokenVersion += 1;
    }
    await writeSession(null);
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
    assertPasswordForSet(newPassword);

    const updated = patchUser(userId, { mustChangePassword: false });
    if (!updated) throw new Error("User not found");

    sec(userId).tokenVersion += 1;

    const current = await readSession();
    await writeSession(buildSession(updated, current?.activeGroupId ?? null));
    return { ...updated };
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
    user.name = trimmedName;
    user.locale = locale;
    sec(user.id);

    const session = buildSession(
      { ...user, mustChangePassword: false },
      invite.groupId,
    );
    await writeSession(session);
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
    await writeSession(session, { autoPickGroup: false });
    return session;
  }

  async refreshSessionUser(user: User): Promise<void> {
    const current = await readSession();
    await writeSession(
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
