import { cookies } from "next/headers";
import type { Session, User } from "@/domain/types";
import type { AuthService } from "@/services/contracts";
import {
  MOCK_OPERATORS,
  MOCK_TEAMMATES,
} from "@/services/mock/data";

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

  // Mock convenience: "alex" → alex@example.com
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

function readSession(): Session | null {
  const raw = cookies().get(MOCK_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
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

    const session: Session = { user };
    writeSession(session);
    return session;
  }

  async logout(): Promise<void> {
    writeSession(null);
  }

  /** Dev helper — switch role without login flow (Settings mock only). */
  async setMockRole(role: "operator" | "teammate"): Promise<void> {
    const user =
      role === "operator"
        ? MOCK_OPERATORS[0]
        : MOCK_TEAMMATES.find((t) => t.id === "user-ana")!;
    writeSession({ user });
  }
}

export const mockAuthService = new MockAuthService();
