import type { Locale as DbLocale } from "@prisma/client";
import { hashToken } from "@/lib/token-hash";
import { prisma } from "@/lib/prisma";

export type LinkTelegramResult =
  | { ok: true; name: string; locale: DbLocale; operator: boolean; alreadyLinked: boolean }
  | { ok: false; reason: "invalid" | "chat_taken" };

/** ponytail: tokens stored hashed — plaintext only exists at creation time. */
export async function linkTelegramChat(
  code: string,
  chatId: string,
): Promise<LinkTelegramResult> {
  const tokenHash = hashToken(code.trim());
  const record = await prisma.telegramLinkToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { memberships: true } } },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return { ok: false, reason: "invalid" };
  }

  const chatOwner = await prisma.user.findFirst({
    where: { telegramChatId: chatId },
    select: { id: true },
  });
  if (chatOwner && chatOwner.id !== record.userId) {
    return { ok: false, reason: "chat_taken" };
  }

  const operator = record.user.memberships.some((m) => m.role === "operator");
  const alreadyLinked = record.user.telegramChatId === chatId;

  if (!alreadyLinked) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { telegramChatId: chatId },
      }),
      prisma.telegramLinkToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
  } else {
    await prisma.telegramLinkToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
  }

  return {
    ok: true,
    name: record.user.name,
    locale: record.user.locale,
    operator,
    alreadyLinked,
  };
}

export async function hasActiveTelegramLinkToken(userId: string): Promise<boolean> {
  const active = await prisma.telegramLinkToken.findFirst({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  return Boolean(active);
}
