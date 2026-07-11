type InviteRecord = { userId: string; groupId: string; expiresAt: number };
type TokenRecord = { userId: string; expiresAt: number };

const MS_72H = 72 * 60 * 60 * 1000;

const inviteTokens = new Map<string, InviteRecord>();
const telegramLinkTokens = new Map<string, TokenRecord>();

function seedInvite(token: string, userId: string, groupId: string) {
  inviteTokens.set(token, { userId, groupId, expiresAt: Date.now() + MS_72H });
}

function seedTelegram(token: string, userId: string) {
  telegramLinkTokens.set(token, { userId, expiresAt: Date.now() + MS_72H });
}

/** ponytail: in-memory tokens reset on server restart — fine for UI mock. */
export function initMockTokens() {
  if (inviteTokens.size > 0) return;

  seedInvite("mock-invite-carla", "user-carla", "group-demo");
  seedInvite("mock-invite-ana", "user-ana", "group-demo");
  seedInvite("mock-invite-bruno", "user-bruno", "group-demo");

  seedTelegram("mock-tg-bruno", "user-bruno");
  seedTelegram("mock-tg-carla", "user-carla");
}

export function createInviteToken(userId: string, groupId: string): string {
  const token = `mock-invite-${userId}-${Date.now().toString(36).slice(-6)}`;
  inviteTokens.set(token, { userId, groupId, expiresAt: Date.now() + MS_72H });
  return token;
}

export function createTelegramLinkToken(userId: string): string {
  const token = `mock-tg-${userId}-${Date.now().toString(36).slice(-6)}`;
  telegramLinkTokens.set(token, { userId, expiresAt: Date.now() + MS_72H });
  return token;
}

export function resolveInvite(token: string): InviteRecord | null {
  const record = inviteTokens.get(token);
  if (!record || record.expiresAt < Date.now()) return null;
  return record;
}

/** @deprecated use resolveInvite */
export function resolveInviteToken(token: string): string | null {
  return resolveInvite(token)?.userId ?? null;
}

export function consumeInvite(token: string): InviteRecord | null {
  const record = resolveInvite(token);
  if (!record) return null;
  inviteTokens.delete(token);
  return record;
}

/** @deprecated use consumeInvite */
export function consumeInviteToken(token: string): string | null {
  return consumeInvite(token)?.userId ?? null;
}

export function getInviteTokenForUser(userId: string): string | null {
  for (const [token, record] of Array.from(inviteTokens.entries())) {
    if (record.userId === userId && record.expiresAt >= Date.now()) {
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
