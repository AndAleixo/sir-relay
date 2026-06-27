import type { Locale, User } from "@/domain/types";
import type { TeammateService, UserService } from "@/services/contracts";
import { MOCK_OPERATOR, MOCK_TEAMMATES } from "@/services/mock/data";

export class MockTeammateService implements TeammateService {
  async listTeammates() {
    return MOCK_TEAMMATES.filter((t) => t.active);
  }

  async getTeammate(id: string) {
    return MOCK_TEAMMATES.find((t) => t.id === id) ?? null;
  }
}

export class MockUserService implements UserService {
  async updateLocale(userId: string, locale: Locale): Promise<User> {
    if (userId === MOCK_OPERATOR.id) {
      return { ...MOCK_OPERATOR, locale };
    }
    const teammate = MOCK_TEAMMATES.find((t) => t.id === userId);
    if (teammate) return { ...teammate, locale };
    throw new Error("User not found");
  }
}

export const mockTeammateService = new MockTeammateService();
export const mockUserService = new MockUserService();
