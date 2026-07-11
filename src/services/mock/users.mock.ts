import type { User } from "@/domain/types";
import { MOCK_OPERATORS, MOCK_TEAMMATES } from "@/services/mock/data";

/** ponytail: in-memory signups reset on server restart. */
export const dynamicUsers: User[] = [];

export function allMockUsers(): User[] {
  return [...MOCK_OPERATORS, ...MOCK_TEAMMATES, ...dynamicUsers];
}

export function findMockUserById(userId: string): User | null {
  return allMockUsers().find((user) => user.id === userId) ?? null;
}

export function findMockUserByEmail(email: string): User | null {
  const normalized = email.trim().toLowerCase();
  const exact = allMockUsers().find(
    (user) => user.active && user.email.toLowerCase() === normalized,
  );
  if (exact) return exact;

  if (!normalized.includes("@")) {
    return (
      allMockUsers().find(
        (user) =>
          user.active && user.email.toLowerCase().split("@")[0] === normalized,
      ) ?? null
    );
  }

  return null;
}

export function patchMockUser(userId: string, patch: Partial<User>): User | null {
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
