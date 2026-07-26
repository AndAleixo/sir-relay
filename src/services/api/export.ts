import type { ExportPayload, ExportUser } from "@/domain/export";
import { toExportTask } from "@/domain/export";
import type { Session, Teammate, User } from "@/domain/types";
import type { ExportService } from "@/services/contracts";
import { requireOperator } from "@/lib/authz";
import { writeAuditFromSession } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { apiOperatorAlertService } from "@/services/api/alerts";
import { toRole, toTeammate, toUser } from "@/services/api/mappers";
import { apiTaskService } from "@/services/api/tasks";

function toExportUser(user: User | Teammate): ExportUser {
  if (user.role === "teammate") {
    const teammate = user as Teammate;
    return {
      name: teammate.name,
      email: teammate.email,
      role: teammate.role,
      locale: teammate.locale,
      active: teammate.active,
      displayName: teammate.displayName ?? null,
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
    displayName: user.displayName ?? null,
    telegramStatus: user.telegramStatus,
  };
}

export class ApiExportService implements ExportService {
  async buildExport(
    ctx: { session: Session },
    userId?: string,
  ): Promise<ExportPayload> {
    requireOperator(ctx.session);
    const groupId = ctx.session.activeGroupId!;

    const memberships = await prisma.groupMembership.findMany({
      where: { groupId },
      include: { user: true },
    });
    const users = memberships
      .filter((row) => row.user.active)
      .map((row) => {
        const role = toRole(row.role);
        return role === "teammate"
          ? toTeammate(row.user, role, row.displayName)
          : toUser(row.user, role, row.displayName);
      });

    const tasks = await apiTaskService.listTasks(ctx);
    const exportedAt = new Date().toISOString();

    if (userId) {
      const user = users.find((entry) => entry.id === userId);
      if (!user) throw new Error("User not found");
      void writeAuditFromSession(ctx.session, "export_data", { scope: "user", userId });
      return {
        exportedAt,
        scope: "user",
        users: [toExportUser(user)],
        tasks: tasks.filter((task) => task.assigneeId === userId).map(toExportTask),
      };
    }

    const alertPrefs = await apiOperatorAlertService.getPrefs(ctx);
    void writeAuditFromSession(ctx.session, "export_data", { scope: "full" });
    return {
      exportedAt,
      scope: "full",
      users: users.map(toExportUser),
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

export const apiExportService = new ApiExportService();
