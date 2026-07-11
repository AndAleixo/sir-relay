import type { SirRelayExport, ExportUser } from "@/domain/export";
import { toExportTask } from "@/domain/export";
import type { Teammate, User } from "@/domain/types";
import { MOCK_OPERATORS, MOCK_TASKS, MOCK_TEAMMATES } from "@/services/mock/data";
import { mockOperatorAlertService } from "@/services/mock/alerts.mock";

function toExportUser(user: User | Teammate): ExportUser {
  if (user.role === "teammate") {
    const teammate = user as Teammate;
    return {
      id: teammate.id,
      name: teammate.name,
      email: teammate.email,
      role: teammate.role,
      locale: teammate.locale,
      active: teammate.active,
      accountStatus: teammate.accountStatus,
      telegramStatus: teammate.telegramStatus,
    };
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    locale: user.locale,
    active: user.active,
    telegramStatus: user.telegramStatus,
  };
}

function listOrgUsers(): (User | Teammate)[] {
  return [
    ...MOCK_OPERATORS.filter((user) => user.active),
    ...MOCK_TEAMMATES.filter((user) => user.active),
  ];
}

export async function buildMockExport(userId?: string): Promise<SirRelayExport> {
  const exportedAt = new Date().toISOString();
  const users = listOrgUsers();

  if (userId) {
    const user = users.find((entry) => entry.id === userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      version: 1,
      exportedAt,
      app: "sirrelay",
      scope: "user",
      scopeUserId: userId,
      users: [toExportUser(user)],
      tasks: MOCK_TASKS.filter((task) => task.assigneeId === userId).map(toExportTask),
      telegramActivity: [],
    };
  }

  const alertPrefs = await mockOperatorAlertService.getPrefs();

  return {
    version: 1,
    exportedAt,
    app: "sirrelay",
    scope: "full",
    scopeUserId: null,
    users: users.map(toExportUser),
    tasks: MOCK_TASKS.map(toExportTask),
    telegramActivity: [],
    alertPrefs,
  };
}

export function mockExportFilename(userId?: string): string {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return userId
    ? `sirrelay-export-${userId}-${day}.json`
    : `sirrelay-export-${day}.json`;
}
