import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { createHash } from "crypto";
import {
  MOCK_OPERATORS,
  MOCK_TASKS,
  MOCK_TEAMMATES,
} from "../src/services/mock/data";
import { MOCK_GROUPS, MOCK_MEMBERSHIPS } from "../src/services/mock/groups.mock";
import { fromLocale } from "../src/services/api/mappers";
import { CURRENT_LEGAL_VERSION } from "../src/lib/legal";

const prisma = new PrismaClient();

/** Shared demo password — api seed (prod-local / VPS); see docs/ENVIRONMENTS.md. */
/** Meets P2-SEC-04 (legacy `demo12345` hashes still log in — grandfather). */
export const DEMO_PASSWORD = "SirRelay1";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  await prisma.operatorAlert.deleteMany();
  await prisma.task.deleteMany();
  await prisma.teammateInviteToken.deleteMany();
  await prisma.groupInvitation.deleteMany();
  await prisma.telegramLinkToken.deleteMany();
  await prisma.groupAlertPrefs.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  for (const op of MOCK_OPERATORS) {
    await prisma.user.create({
      data: {
        id: op.id,
        name: op.name,
        email: op.email,
        passwordHash,
        locale: fromLocale(op.locale),
        active: op.active,
        mustChangePassword: op.mustChangePassword ?? false,
        accountStatus: "active",
        termsVersion: CURRENT_LEGAL_VERSION,
        termsAcceptedAt: new Date(),
        lastActiveGroupId: op.id === "user-operator-2" ? "group-demo" : null,
        telegramChatId: op.telegramStatus === "linked" ? "demo-chat-op" : null,
      },
    });
  }

  for (const teammate of MOCK_TEAMMATES) {
    const accepted = teammate.accountStatus !== "invited";
    await prisma.user.create({
      data: {
        id: teammate.id,
        name: teammate.name,
        email: teammate.email,
        passwordHash:
          teammate.accountStatus === "invited" ? null : passwordHash,
        locale: fromLocale(teammate.locale),
        active: teammate.active,
        accountStatus: teammate.accountStatus,
        termsVersion: accepted ? CURRENT_LEGAL_VERSION : null,
        termsAcceptedAt: accepted ? new Date() : null,
        telegramChatId:
          teammate.telegramStatus === "linked" ? `demo-chat-${teammate.id}` : null,
      },
    });
  }

  for (const group of MOCK_GROUPS) {
    await prisma.group.create({
      data: {
        id: group.id,
        name: group.name,
        ownerUserId: group.ownerUserId,
      },
    });
    await prisma.groupAlertPrefs.create({ data: { groupId: group.id } });
  }

  for (const membership of MOCK_MEMBERSHIPS) {
    await prisma.groupMembership.create({
      data: {
        groupId: membership.groupId,
        userId: membership.userId,
        role: membership.role,
      },
    });
  }

  const operatorId = MOCK_OPERATORS[0].id;
  for (const task of MOCK_TASKS) {
    await prisma.task.create({
      data: {
        id: task.id,
        groupId: "group-demo",
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        createdById: operatorId,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        sortOrder: task.sortOrder,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      },
    });
  }

  const demoInvites: Array<[string, string, string]> = [
    ["mock-invite-carla", "user-carla", "group-demo"],
  ];

  for (const [token, userId, groupId] of demoInvites) {
    await prisma.teammateInviteToken.create({
      data: {
        userId,
        groupId,
        tokenHash: hashToken(token),
        expiresAt,
      },
    });
  }

  console.log("seed ok · demo password:", DEMO_PASSWORD);
  console.log("  sam@example.com (2 groups) · ana@example.com (teammate)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
