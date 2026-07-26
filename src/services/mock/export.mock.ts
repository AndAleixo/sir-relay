import type { ExportPayload, ExportUser } from "@/domain/export";
import { toExportTask } from "@/domain/export";
import type { Session, Task, Teammate, User } from "@/domain/types";
import type { ExportService } from "@/services/contracts";
import { requireOperator } from "@/lib/authz";
import { groupMemberLabel } from "@/lib/group-member-label";
import { MOCK_OPERATORS, MOCK_TASKS, MOCK_TEAMMATES } from "@/services/mock/data";
import { mockOperatorAlertService } from "@/services/mock/alerts.mock";
import {
  getMembershipDisplayName,
  userIdsInGroup,
} from "@/services/mock/groups.mock";
import { findMockUserById } from "@/services/mock/users.mock";

function toExportUser(
  user: User | Teammate,
  displayName: string | null,
): ExportUser {
  if (user.role === "teammate") {
    const teammate = user as Teammate;
    return {
      name: teammate.name,
      email: teammate.email,
      role: teammate.role,
      locale: teammate.locale,
      active: teammate.active,
      displayName,
      accountStatus: teammate.accountStatus,
      telegramStatus: teammate.telegramStatus,
    };
  }

  return {
    name: user.name,
    email: user.email,
    role: user.role,
    locale: user.locale,
    active: user.active,
    displayName,
    telegramStatus: user.telegramStatus,
  };
}

function usersInGroup(groupId: string): { user: User | Teammate; displayName: string | null }[] {
  const ids = userIdsInGroup(groupId);
  return [
    ...MOCK_OPERATORS.filter((user) => user.active && ids.has(user.id)),
    ...MOCK_TEAMMATES.filter((user) => user.active && ids.has(user.id)),
  ].map((user) => ({
    user,
    displayName: getMembershipDisplayName(groupId, user.id),
  }));
}

function tasksInGroup(groupId: string): Task[] {
  const ids = userIdsInGroup(groupId);
  return MOCK_TASKS.filter((task) => ids.has(task.assigneeId)).map((task) => {
    const user = findMockUserById(task.assigneeId);
    if (!user) return task;
    const displayName = getMembershipDisplayName(groupId, task.assigneeId);
    return {
      ...task,
      assigneeName: groupMemberLabel({ ...user, displayName }),
    };
  });
}

export class MockExportService implements ExportService {
  async buildExport(
    ctx: { session: Session },
    userId?: string,
  ): Promise<ExportPayload> {
    requireOperator(ctx.session);
    const groupId = ctx.session.activeGroupId!;

    const exportedAt = new Date().toISOString();
    const users = usersInGroup(groupId);
    const tasks = tasksInGroup(groupId);

    if (userId) {
      const entry = users.find((row) => row.user.id === userId);
      if (!entry) throw new Error("User not found");

      return {
        exportedAt,
        scope: "user",
        users: [toExportUser(entry.user, entry.displayName)],
        tasks: tasks.filter((task) => task.assigneeId === userId).map(toExportTask),
      };
    }

    const alertPrefs = await mockOperatorAlertService.getPrefs(ctx);

    return {
      exportedAt,
      scope: "full",
      users: users.map((entry) => toExportUser(entry.user, entry.displayName)),
      tasks: tasks.map(toExportTask),
      alertPrefs,
    };
  }

  filename(userId?: string): string {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return userId
      ? `sirrelay-export-${userId}-${day}.csv`
      : `sirrelay-export-${day}.csv`;
  }
}

export const mockExportService = new MockExportService();
