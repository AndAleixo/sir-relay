import { randomBytes } from "crypto";

type InviteRecord = { userId: string; groupId: string; expiresAt: number };
type TokenRecord = { userId: string; expiresAt: number };

const MS_72H = 72 * 60 * 60 * 1000;

type MockTokenStore = {
  inviteTokens: Map<string, InviteRecord>;
  telegramLinkTokens: Map<string, TokenRecord>;
  seeded: boolean;
};

// ponytail: globalThis — same module-split issue as groups.mock in Next server actions.
function tokenStore(): MockTokenStore {
  const key = "__sirrelay_mock_tokens__";
  const g = globalThis as typeof globalThis & {
    [k: string]: MockTokenStore | undefined;
  };
  if (!g[key]) {
    g[key] = {
      inviteTokens: new Map(),
      telegramLinkTokens: new Map(),
      seeded: false,
    };
  }
  return g[key];
}

function seedInvite(token: string, userId: string, groupId: string) {
  tokenStore().inviteTokens.set(token, {
    userId,
    groupId,
    expiresAt: Date.now() + MS_72H,
  });
}

function seedTelegram(token: string, userId: string) {
  tokenStore().telegramLinkTokens.set(token, {
    userId,
    expiresAt: Date.now() + MS_72H,
  });
}

/** ponytail: in-memory tokens reset on server restart — fine for UI mock. */
export function initMockTokens() {
  const store = tokenStore();
  if (store.seeded) return;
  store.seeded = true;

  seedInvite("mock-invite-carla", "user-carla", "group-demo");
}

export function createInviteToken(userId: string, groupId: string): string {
  const token = `mock-invite-${userId}-${randomBytes(6).toString("base64url")}`;
  tokenStore().inviteTokens.set(token, {
    userId,
    groupId,
    expiresAt: Date.now() + MS_72H,
  });
  return token;
}

export function createTelegramLinkToken(userId: string): string {
  const token = `mock-tg-${userId}-${randomBytes(6).toString("base64url")}`;
  tokenStore().telegramLinkTokens.set(token, {
    userId,
    expiresAt: Date.now() + MS_72H,
  });
  return token;
}

export function resolveInvite(token: string): InviteRecord | null {
  const record = tokenStore().inviteTokens.get(token);
  if (!record || record.expiresAt < Date.now()) return null;
  return record;
}

export function consumeInvite(token: string): InviteRecord | null {
  const store = tokenStore();
  const record = resolveInvite(token);
  if (!record) return null;
  store.inviteTokens.delete(token);
  return record;
}

/** Mark all open invites for a user used (signup merge / activation). */
export function consumeAllInvitesForUser(userId: string): void {
  const store = tokenStore();
  for (const [token, record] of Array.from(store.inviteTokens.entries())) {
    if (record.userId === userId) {
      store.inviteTokens.delete(token);
    }
  }
}

export function getInviteTokenForUser(userId: string, groupId?: string): string | null {
  for (const [token, record] of Array.from(tokenStore().inviteTokens.entries())) {
    if (
      record.userId === userId &&
      (!groupId || record.groupId === groupId) &&
      record.expiresAt >= Date.now()
    ) {
      return token;
    }
  }
  return null;
}

export function invalidateInviteTokens(userId: string, groupId: string): void {
  const store = tokenStore();
  for (const [token, record] of Array.from(store.inviteTokens.entries())) {
    if (record.userId === userId && record.groupId === groupId) {
      store.inviteTokens.delete(token);
    }
  }
}

export function getTelegramLinkTokenForUser(userId: string): string | null {
  for (const [token, record] of Array.from(tokenStore().telegramLinkTokens.entries())) {
    if (record.userId === userId && record.expiresAt >= Date.now()) {
      return token;
    }
  }
  return null;
}

initMockTokens();
