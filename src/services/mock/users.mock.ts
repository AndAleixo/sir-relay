import type { User } from "@/domain/types";
import { MOCK_OPERATORS, MOCK_TEAMMATES } from "@/services/mock/data";

function dynamicUsers(): User[] {
  const key = "__sirrelay_mock_dynamic_users__";
  const g = globalThis as typeof globalThis & { [k: string]: User[] | undefined };
  if (!g[key]) g[key] = [];
  return g[key];
}

export function registerDynamicUser(user: User): void {
  dynamicUsers().push(user);
}

export function allMockUsers(): User[] {
  return [...MOCK_OPERATORS, ...MOCK_TEAMMATES, ...dynamicUsers()];
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

export function findAnyMockUserByEmail(email: string): User | null {
  const normalized = email.trim().toLowerCase();
  return allMockUsers().find((user) => user.email.toLowerCase() === normalized) ?? null;
}

export function patchMockUser(userId: string, patch: Partial<User>): User | null {
  const lists = [MOCK_OPERATORS, MOCK_TEAMMATES, dynamicUsers()];
  for (const list of lists) {
    const user = list.find((u) => u.id === userId);
    if (user) {
      Object.assign(user, patch);
      return user;
    }
  }
  return null;
}
