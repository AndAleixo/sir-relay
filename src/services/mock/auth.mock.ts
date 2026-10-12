import { cookies } from "next/headers";
import type { Session, User } from "@/domain/types";
import type { Locale } from "@/domain/types";
import { defaultLocale } from "@/i18n/config";
import { hydrateSession } from "@/lib/session-hydrate";
import { assertPasswordForSet } from "@/lib/password-policy";
import { isLoginLocked } from "@/lib/login-lockout";
import { CURRENT_LEGAL_VERSION, needsLegalAccept } from "@/lib/legal";
import type { AuthService, SignupResult } from "@/services/contracts";
import {
  findAnyMockUserByEmail,
  findMockUserByEmail,
  findMockUserById,
  patchMockUser,
  registerDynamicUser,
} from "@/services/mock/users.mock";
import { mockGroupMembershipLookup, rememberMockLastActiveGroup } from "@/services/mock/groups.mock";
import {
  consumeAllInvitesForUser,
  consumeInvite,
  resolveInvite,
} from "@/services/mock/tokens.mock";

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
        user: {
          ...fresh,
          needsLegalAccept: needsLegalAccept(fresh.termsVersion),
        },
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
    {
      user: {
        ...user,
        needsLegalAccept: needsLegalAccept(user.termsVersion),
      },
      activeGroupId,
    },
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
  ): Promise<SignupResult> {
    if (!name.trim() || !email.trim()) {
      throw new Error("Invalid signup");
    }
    assertPasswordForSet(password);

    const normalized = email.trim().toLowerCase();
    const existing = findAnyMockUserByEmail(normalized);
    const trimmedName = name.trim();

    if (existing) {
      // P1-AUTH-13: invited placeholder only (operators have no accountStatus → taken).
      const status =
        "accountStatus" in existing
          ? (existing as { accountStatus: string }).accountStatus
          : "active";
      if (status !== "invited" || !existing.active) {
        throw new Error("Email taken");
      }

      const updated = patchUser(existing.id, {
        name: trimmedName,
        locale,
        mustChangePassword: false,
        termsVersion: CURRENT_LEGAL_VERSION,
        needsLegalAccept: false,
      });
      if (!updated) throw new Error("Invalid signup");
      (updated as unknown as { accountStatus: string }).accountStatus = "active";
      consumeAllInvitesForUser(existing.id);
      sec(existing.id);

      // P1-AUTH-14: auto-pick group → teammate /tasks via resolveEntryPath.
      const session = buildSession(updated);
      await writeSession(session);
      return { kind: "session", session };
    }

    const user: User = {
      id: `user-${Date.now().toString(36)}`,
      name: trimmedName,
      email: normalized,
      role: "operator",
      locale,
      active: true,
      mustChangePassword: false,
      termsVersion: CURRENT_LEGAL_VERSION,
      needsLegalAccept: false,
    };
    registerDynamicUser(user);
    sec(user.id);

    // Mock: skip inbox verify so demos stay one-click.
    const session: Session = { user: { ...user }, activeGroupId: null };
    await writeSession(session, { autoPickGroup: false });
    const hydrated = hydrateSession(session, mockGroupMembershipLookup, {
      autoPickGroup: false,
    })!;
    return { kind: "session", session: hydrated };
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

  async acceptLegalTerms(userId: string): Promise<Session> {
    const updated = patchUser(userId, {
      termsVersion: CURRENT_LEGAL_VERSION,
      needsLegalAccept: false,
    });
    if (!updated) throw new Error("User not found");
    const current = await readSession();
    const session = buildSession(updated, current?.activeGroupId ?? null);
    await writeSession(session, { autoPickGroup: false });
    return session;
  }

  // ponytail: mock has no inbox — UI routes work; real tokens only in api mode.
  async requestPasswordReset(): Promise<void> {
    /* no-op */
  }

  async resetPasswordWithToken(_token: string, password: string): Promise<void> {
    assertPasswordForSet(password);
    /* does not mutate mock users */
  }

  async verifyEmailWithToken(): Promise<Session> {
    throw new Error("Invalid token");
  }

  async resendVerificationEmail(): Promise<void> {
    /* no-op */
  }
}

export const mockAuthService = new MockAuthService();
