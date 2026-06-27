import type { Session } from "@/domain/types";
import type { AuthService } from "@/services/contracts";
import {
  MOCK_OPERATOR,
  MOCK_TEAMMATE_USER,
} from "@/services/mock/data";

/** In-memory mock session — swap for cookie/JWT when wiring real auth. */
let currentSession: Session | null = { user: MOCK_OPERATOR };

export class MockAuthService implements AuthService {
  async getSession(): Promise<Session | null> {
    return currentSession;
  }

  async login(email: string, _password: string): Promise<Session> {
    const user =
      email.includes("ana") || email.includes("teammate")
        ? MOCK_TEAMMATE_USER
        : MOCK_OPERATOR;
    currentSession = { user };
    return currentSession;
  }

  async logout(): Promise<void> {
    currentSession = null;
  }

  /** Dev helper — switch role without login flow. */
  setMockRole(role: "operator" | "teammate"): void {
    currentSession = {
      user: role === "operator" ? MOCK_OPERATOR : MOCK_TEAMMATE_USER,
    };
  }
}

export const mockAuthService = new MockAuthService();
