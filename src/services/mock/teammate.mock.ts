import type { Locale, Teammate, User } from "@/domain/types";
import type {
  CreateTeammateInput,
  OrganizationUser,
  TeammateService,
  UserService,
} from "@/services/contracts";
import { MOCK_OPERATOR, MOCK_OPERATORS, MOCK_TEAMMATES } from "@/services/mock/data";

export class MockTeammateService implements TeammateService {
  async listTeammates() {
    return MOCK_TEAMMATES.filter((t) => t.active);
  }

  async listOrganizationUsers(): Promise<OrganizationUser[]> {
    const operators = MOCK_OPERATORS.filter((user) => user.active) as OrganizationUser[];
    const teammates = MOCK_TEAMMATES.filter((user) => user.active);
    return [...operators, ...teammates];
  }

  async getTeammate(id: string) {
    return MOCK_TEAMMATES.find((t) => t.id === id) ?? null;
  }

  async createTeammate(input: CreateTeammateInput): Promise<Teammate> {
    const id = `user-${Date.now()}`;
    const teammate: Teammate = {
      id,
      name: input.name,
      email: input.email.toLowerCase(),
      role: "teammate",
      locale: input.locale,
      active: true,
      accountStatus: "invited",
      telegramStatus: "pending",
    };
    MOCK_TEAMMATES.push(teammate);
    return teammate;
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
