import { prisma } from "@/lib/prisma";
import { hashToken, newToken } from "@/lib/token-hash";
import type { EmailTokenType } from "@prisma/client";

const TTL_MS: Record<EmailTokenType, number> = {
  email_verify: 24 * 60 * 60 * 1000,
  password_reset: 60 * 60 * 1000,
};

export async function issueEmailToken(
  userId: string,
  type: EmailTokenType,
): Promise<string> {
  const token = newToken(type === "email_verify" ? "ev" : "pr");
  const expiresAt = new Date(Date.now() + TTL_MS[type]);

  await prisma.emailToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.emailToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  return token;
}

export async function consumeEmailToken(
  token: string,
  type: EmailTokenType,
): Promise<{ userId: string } | null> {
  const row = await prisma.emailToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!row || row.type !== type || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return null;
  }
  await prisma.emailToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });
  return { userId: row.userId };
}
