import { randomBytes } from "node:crypto";
import type { Session, User } from "@/domain/types";
import { hashToken, newToken } from "@/lib/token-hash";
import { prisma } from "@/lib/prisma";
import { getServices, serviceMode } from "@/services";
import { MOCK_OPERATORS, MOCK_TEAMMATES } from "@/services/mock/data";
import { toUser } from "@/services/api/mappers";

export const EDITOR_API_KEY_NAME = "Editor";
export const MAX_API_KEYS_PER_USER = 10;
export const MAX_API_KEY_NAME_LEN = 40;

export type ClientApiKeyPublic = {
  id: string;
  name: string;
  prefix: string;
  /** Empty = all groups. */
  groupIds: string[];
  createdAt: string;
};

type MockKey = {
  id: string;
  userId: string;
  name: string;
  tokenHash: string;
  prefix: string;
  groupIds: string[];
  createdAt: Date;
};

/** ponytail: mock has no ClientApiKey table; process-local rows. */
const mockKeys: MockKey[] = [];

function newKeyId(): string {
  return `cak_${randomBytes(12).toString("base64url")}`;
}

function tokenPrefix(token: string): string {
  return token.length <= 12 ? token : `${token.slice(0, 12)}…`;
}

function normalizeName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > MAX_API_KEY_NAME_LEN) return null;
  return name;
}

function normalizeGroupIds(raw: string[] | undefined): string[] {
  if (!raw?.length) return [];
  return [...new Set(raw.map((id) => id.trim()).filter(Boolean))];
}

export async function listClientApiKeys(
  userId: string,
): Promise<ClientApiKeyPublic[]> {
  if (serviceMode === "api") {
    const rows = await prisma.clientApiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        prefix: true,
        groupIds: true,
        createdAt: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      groupIds: row.groupIds,
      createdAt: row.createdAt.toISOString(),
    }));
  }
  return mockKeys
    .filter((row) => row.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      groupIds: row.groupIds,
      createdAt: row.createdAt.toISOString(),
    }));
}

export async function createClientApiKey(
  userId: string,
  opts: { name: string; groupIds?: string[] },
): Promise<
  { token: string; key: ClientApiKeyPublic } | { error: "bad_name" | "limit" }
> {
  const name = normalizeName(opts.name);
  if (!name) return { error: "bad_name" };
  const groupIds = normalizeGroupIds(opts.groupIds);
  const existing = await listClientApiKeys(userId);
  if (existing.length >= MAX_API_KEYS_PER_USER) return { error: "limit" };

  const token = newToken("link");
  const tokenHash = hashToken(token);
  const prefix = tokenPrefix(token);
  const id = newKeyId();
  const createdAt = new Date();

  if (serviceMode === "api") {
    const row = await prisma.clientApiKey.create({
      data: { id, userId, name, tokenHash, prefix, groupIds },
    });
    return {
      token,
      key: {
        id: row.id,
        name: row.name,
        prefix: row.prefix,
        groupIds: row.groupIds,
        createdAt: row.createdAt.toISOString(),
      },
    };
  }

  mockKeys.push({ id, userId, name, tokenHash, prefix, groupIds, createdAt });
  return {
    token,
    key: {
      id,
      name,
      prefix,
      groupIds,
      createdAt: createdAt.toISOString(),
    },
  };
}

export async function deleteClientApiKey(
  userId: string,
  keyId: string,
): Promise<boolean> {
  if (serviceMode === "api") {
    const result = await prisma.clientApiKey.deleteMany({
      where: { id: keyId, userId },
    });
    return result.count > 0;
  }
  const idx = mockKeys.findIndex(
    (row) => row.id === keyId && row.userId === userId,
  );
  if (idx < 0) return false;
  mockKeys.splice(idx, 1);
  return true;
}

/** /connect: replace the dedicated Editor key (at most one auto-link key). */
export async function issueLinkToken(userId: string): Promise<string> {
  if (serviceMode === "api") {
    await prisma.clientApiKey.deleteMany({
      where: { userId, name: EDITOR_API_KEY_NAME },
    });
  } else {
    for (let i = mockKeys.length - 1; i >= 0; i--) {
      if (
        mockKeys[i].userId === userId &&
        mockKeys[i].name === EDITOR_API_KEY_NAME
      ) {
        mockKeys.splice(i, 1);
      }
    }
  }
  const result = await createClientApiKey(userId, {
    name: EDITOR_API_KEY_NAME,
    groupIds: [],
  });
  if ("error" in result) {
    throw new Error(`issueLinkToken failed: ${result.error}`);
  }
  return result.token;
}

type ResolvedToken = {
  userId: string;
  allowedGroupIds: string[];
};

async function resolveLinkToken(token: string): Promise<ResolvedToken | null> {
  const tokenHash = hashToken(token.trim());
  if (!tokenHash) return null;

  if (serviceMode === "api") {
    const key = await prisma.clientApiKey.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        groupIds: true,
        user: { select: { active: true } },
      },
    });
    if (!key?.user.active) return null;
    void prisma.clientApiKey
      .update({
        where: { id: key.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => undefined);
    return { userId: key.userId, allowedGroupIds: key.groupIds };
  }

  const mock = mockKeys.find((row) => row.tokenHash === tokenHash);
  if (!mock) return null;
  return { userId: mock.userId, allowedGroupIds: mock.groupIds };
}

export async function sessionFromClientRequest(
  request: Request,
  groupId: string | null,
): Promise<Session | null> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const resolved = await resolveLinkToken(header.slice("Bearer ".length));
  if (!resolved) return null;
  return sessionForClientUser(
    resolved.userId,
    groupId,
    resolved.allowedGroupIds,
  );
}

export async function userIdForLinkToken(
  token: string,
): Promise<string | null> {
  const resolved = await resolveLinkToken(token);
  return resolved?.userId ?? null;
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
  allowedGroupIds: string[] = [],
): Promise<Session | null> {
  let groups = await getServices().groups.listForUser(userId);
  if (allowedGroupIds.length > 0) {
    const allow = new Set(allowedGroupIds);
    groups = groups.filter((row) => allow.has(row.id));
  }
  const group =
    groups.find((row) => row.id === groupId) ?? groups[0] ?? null;
  if (groupId && allowedGroupIds.length > 0 && !group) {
    return null;
  }

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
