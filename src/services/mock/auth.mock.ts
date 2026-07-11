import { cookies } from "next/headers";
import type { Session, User } from "@/domain/types";
import type { AuthService } from "@/services/contracts";
import {
  MOCK_OPERATORS,
  MOCK_TEAMMATES,
} from "@/services/mock/data";
import { consumeInviteToken } from "@/services/mock/tokens.mock";

const MOCK_SESSION_COOKIE = "sirrelay_mock_session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

function findUserByEmail(email: string): User | null {
  const normalized = email.trim().toLowerCase();
  const allUsers: User[] = [...MOCK_OPERATORS, ...MOCK_TEAMMATES];

  const exact = allUsers.find(
    (user) => user.active && user.email.toLowerCase() === normalized,
  );
  if (exact) return exact;

  if (!normalized.includes("@")) {
    return (
      allUsers.find(
        (user) =>
          user.active && user.email.toLowerCase().split("@")[0] === normalized,
      ) ?? null
    );
  }

  return null;
}

function findUserById(userId: string): User | null {
  return (
    MOCK_OPERATORS.find((user) => user.id === userId) ??
    MOCK_TEAMMATES.find((user) => user.id === userId) ??
    null
  );
}

function readSession(): Session | null {
  const raw = cookies().get(MOCK_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    const fresh = findUserById(session.user.id);
    if (!fresh || !fresh.active) return null;
    return { user: { ...fresh } };
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
  jar.set(MOCK_SESSION_COOKIE, JSON.stringify(session), cookieOptions);
}

function patchUser(userId: string, patch: Partial<User>) {
  const operator = MOCK_OPERATORS.find((user) => user.id === userId);
  if (operator) {
    Object.assign(operator, patch);
    return operator;
  }

  const teammate = MOCK_TEAMMATES.find((user) => user.id === userId);
  if (teammate) {
    Object.assign(teammate, patch);
    return teammate;
  }

  return null;
}

/** Mock session in httpOnly cookie — survives server actions like real auth. */
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

    const session: Session = { user: { ...user } };
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

    writeSession({ user: { ...updated } });
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

    const teammate = MOCK_TEAMMATES.find((user) => user.id === userId);
    if (!teammate || !teammate.active) {
      throw new Error("Invalid token");
    }

    teammate.accountStatus = "active";
    const session: Session = { user: { ...teammate, mustChangePassword: false } };
    writeSession(session);
    return session;
  }

  async updateSessionUser(user: User): Promise<void> {
    writeSession({ user });
  }
}

export const mockAuthService = new MockAuthService();
