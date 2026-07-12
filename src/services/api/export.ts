import type { SirRelayExport, ExportUser } from "@/domain/export";
import { toExportTask } from "@/domain/export";
import type { Session, Teammate, User } from "@/domain/types";
import type { ExportService } from "@/services/contracts";
import { prisma } from "@/lib/prisma";
import { apiOperatorAlertService } from "@/services/api/alerts";
import { toRole, toTeammate, toUser } from "@/services/api/mappers";
import { apiTaskService } from "@/services/api/tasks";

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

export class ApiExportService implements ExportService {
  async buildExport(
    ctx: { session: Session },
    userId?: string,
  ): Promise<SirRelayExport> {
    const groupId = ctx.session.activeGroupId;
    if (!groupId) throw new Error("No active group");

    const memberships = await prisma.groupMembership.findMany({
      where: { groupId },
      include: { user: true },
    });
    const users = memberships
      .filter((row) => row.user.active)
      .map((row) => {
        const role = toRole(row.role);
        return role === "teammate"
          ? toTeammate(row.user, role)
          : toUser(row.user, role);
      });

    const tasks = await apiTaskService.listTasks(ctx);
    const exportedAt = new Date().toISOString();

    if (userId) {
      const user = users.find((entry) => entry.id === userId);
      if (!user) throw new Error("User not found");
      return {
        version: 1,
        exportedAt,
        app: "sirrelay",
        scope: "user",
        scopeUserId: userId,
        users: [toExportUser(user)],
        tasks: tasks.filter((task) => task.assigneeId === userId).map(toExportTask),
        telegramActivity: [],
      };
    }

    const alertPrefs = await apiOperatorAlertService.getPrefs(ctx);
    return {
      version: 1,
      exportedAt,
      app: "sirrelay",
      scope: "full",
      scopeUserId: null,
      users: users.map(toExportUser),
      tasks: tasks.map(toExportTask),
      telegramActivity: [],
      alertPrefs,
    };
  }

  filename(userId?: string): string {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return userId
      ? `sirrelay-export-${userId}-${day}.json`
      : `sirrelay-export-${day}.json`;
  }
}

export const apiExportService = new ApiExportService();
