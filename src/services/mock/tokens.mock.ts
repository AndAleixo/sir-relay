type TokenRecord = { userId: string; expiresAt: number };

const MS_72H = 72 * 60 * 60 * 1000;

const inviteTokens = new Map<string, TokenRecord>();
const telegramLinkTokens = new Map<string, TokenRecord>();

function seedToken(
  map: Map<string, TokenRecord>,
  token: string,
  userId: string,
) {
  map.set(token, { userId, expiresAt: Date.now() + MS_72H });
}

/** ponytail: in-memory tokens reset on server restart — fine for UI mock. */
export function initMockTokens() {
  if (inviteTokens.size > 0) return;

  seedToken(inviteTokens, "mock-invite-carla", "user-carla");
  seedToken(inviteTokens, "mock-invite-ana", "user-ana");
  seedToken(inviteTokens, "mock-invite-bruno", "user-bruno");

  seedToken(telegramLinkTokens, "mock-tg-bruno", "user-bruno");
  seedToken(telegramLinkTokens, "mock-tg-carla", "user-carla");
}

export function createInviteToken(userId: string): string {
  const token = `mock-invite-${userId}-${Date.now().toString(36).slice(-6)}`;
  inviteTokens.set(token, { userId, expiresAt: Date.now() + MS_72H });
  return token;
}

export function createTelegramLinkToken(userId: string): string {
  const token = `mock-tg-${userId}-${Date.now().toString(36).slice(-6)}`;
  telegramLinkTokens.set(token, { userId, expiresAt: Date.now() + MS_72H });
  return token;
}

export function resolveInviteToken(token: string): string | null {
  const record = inviteTokens.get(token);
  if (!record || record.expiresAt < Date.now()) return null;
  return record.userId;
}

export function consumeInviteToken(token: string): string | null {
  const userId = resolveInviteToken(token);
  if (!userId) return null;
  inviteTokens.delete(token);
  return userId;
}

export function getInviteTokenForUser(userId: string): string | null {
  for (const token of Array.from(inviteTokens.keys())) {
    const record = inviteTokens.get(token);
    if (record?.userId === userId && record.expiresAt >= Date.now()) {
      return token;
    }
  }
  return null;
}

export function getTelegramLinkTokenForUser(userId: string): string | null {
  for (const token of Array.from(telegramLinkTokens.keys())) {
    const record = telegramLinkTokens.get(token);
    if (record?.userId === userId && record.expiresAt >= Date.now()) {
      return token;
    }
  }
  return null;
}

initMockTokens();
