import type { Session, User } from "@/domain/types";
import { hashToken, newToken } from "@/lib/token-hash";
import { prisma } from "@/lib/prisma";
import { getServices, serviceMode } from "@/services";
import { MOCK_OPERATORS, MOCK_TEAMMATES } from "@/services/mock/data";
import { toUser } from "@/services/api/mappers";

/** ponytail: mock has no user column; one process-local token per account. */
const mockTokenByUser = new Map<string, string>();

export async function issueLinkToken(userId: string): Promise<string> {
  const token = newToken("link");
  const tokenHash = hashToken(token);
  if (serviceMode === "api") {
    await prisma.user.update({
      where: { id: userId },
      data: { linkTokenHash: tokenHash },
    });
    return token;
  }
  for (const [id, hash] of mockTokenByUser) {
    if (id === userId || hash === tokenHash) mockTokenByUser.delete(id);
  }
  mockTokenByUser.set(userId, tokenHash);
  return token;
}

export async function hasLinkToken(userId: string): Promise<boolean> {
  if (serviceMode === "api") {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { linkTokenHash: true },
    });
    return Boolean(row?.linkTokenHash);
  }
  return mockTokenByUser.has(userId);
}

export async function revokeLinkToken(userId: string): Promise<void> {
  if (serviceMode === "api") {
    await prisma.user.update({
      where: { id: userId },
      data: { linkTokenHash: null },
    });
    return;
  }
  mockTokenByUser.delete(userId);
}

export async function sessionFromClientRequest(
  request: Request,
  groupId: string | null,
): Promise<Session | null> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const userId = await userIdForLinkToken(header.slice("Bearer ".length));
  if (!userId) return null;
  return sessionForClientUser(userId, groupId);
}

export async function userIdForLinkToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token.trim());
  if (!tokenHash) return null;
  if (serviceMode === "api") {
    const user = await prisma.user.findUnique({
      where: { linkTokenHash: tokenHash },
      select: { id: true, active: true },
    });
    return user?.active ? user.id : null;
  }
  for (const [userId, hash] of mockTokenByUser) {
    if (hash === tokenHash) return userId;
  }
  return null;
}

function mockUser(userId: string): User | null {
  return (
    MOCK_OPERATORS.find((row) => row.id === userId) ??
    MOCK_TEAMMATES.find((row) => row.id === userId) ??
    null
  );
}

/** Session scoped to one membership. Role comes from that group, not the account. */
export async function sessionForClientUser(
  userId: string,
  groupId: string | null,
): Promise<Session | null> {
  const groups = await getServices().groups.listForUser(userId);
  const group = groups.find((row) => row.id === groupId) ?? groups[0] ?? null;

  if (serviceMode === "api") {
    const row = await prisma.user.findUnique({ where: { id: userId } });
    if (!row?.active) return null;
    return {
      user: toUser(row, group?.role ?? "teammate"),
      activeGroupId: group?.id ?? null,
    };
  }

  const user = mockUser(userId);
  if (!user?.active) return null;
  return {
    user: { ...user, role: group?.role ?? "teammate" },
    activeGroupId: group?.id ?? null,
  };
}
