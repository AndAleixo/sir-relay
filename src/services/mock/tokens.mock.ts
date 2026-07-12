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
  seedInvite("mock-invite-ana", "user-ana", "group-demo");
  seedInvite("mock-invite-ana-side", "user-ana", "group-side");
  seedInvite("mock-invite-bruno", "user-bruno", "group-demo");
}

export function createInviteToken(userId: string, groupId: string): string {
  const token = `mock-invite-${userId}-${Date.now().toString(36).slice(-6)}`;
  tokenStore().inviteTokens.set(token, {
    userId,
    groupId,
    expiresAt: Date.now() + MS_72H,
  });
  return token;
}

export function createTelegramLinkToken(userId: string): string {
  const token = `mock-tg-${userId}-${Date.now().toString(36).slice(-6)}`;
  tokenStore().telegramLinkTokens.set(token, {
    userId,
    expiresAt: Date.now() + MS_72H,
  });
  return token;
}

/** Demo tokens — re-seed when consumed so panel testing keeps working. */
function ensureDemoInvites() {
  if (!tokenStore().inviteTokens.has("mock-invite-ana")) {
    seedInvite("mock-invite-ana", "user-ana", "group-demo");
  }
  if (!tokenStore().inviteTokens.has("mock-invite-ana-side")) {
    seedInvite("mock-invite-ana-side", "user-ana", "group-side");
  }
  if (!tokenStore().inviteTokens.has("mock-invite-bruno")) {
    seedInvite("mock-invite-bruno", "user-bruno", "group-demo");
  }
  if (!tokenStore().inviteTokens.has("mock-invite-carla")) {
    seedInvite("mock-invite-carla", "user-carla", "group-demo");
  }
}

export function resolveInvite(token: string): InviteRecord | null {
  ensureDemoInvites();
  const record = tokenStore().inviteTokens.get(token);
  if (!record || record.expiresAt < Date.now()) return null;
  return record;
}

/** @deprecated use resolveInvite */
export function resolveInviteToken(token: string): string | null {
  return resolveInvite(token)?.userId ?? null;
}

export function consumeInvite(token: string): InviteRecord | null {
  const store = tokenStore();
  const record = resolveInvite(token);
  if (!record) return null;
  store.inviteTokens.delete(token);
  return record;
}

/** @deprecated use consumeInvite */
export function consumeInviteToken(token: string): string | null {
  return consumeInvite(token)?.userId ?? null;
}

export function getInviteTokenForUser(userId: string): string | null {
  for (const [token, record] of Array.from(tokenStore().inviteTokens.entries())) {
    if (record.userId === userId && record.expiresAt >= Date.now()) {
      return token;
    }
  }
  return null;
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
