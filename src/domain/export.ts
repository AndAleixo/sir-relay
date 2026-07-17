import type { Locale, Role, Task, TaskStatus } from "@/domain/types";
import type { OperatorAlertPrefs } from "@/services/alert.types";

export type ExportScope = "full" | "user";

export interface ExportUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  locale: Locale;
  active: boolean;
  /** Per-group fantasy label when set; UI prefers this over `name`. */
  displayName?: string | null;
  accountStatus?: "invited" | "active";
  telegramStatus?: "linked" | "pending";
}

export interface ExportTask {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  status: TaskStatus;
  dueDate: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface SirRelayExport {
  version: 1;
  exportedAt: string;
  app: "sirrelay";
  scope: ExportScope;
  scopeUserId: string | null;
  users: ExportUser[];
  tasks: ExportTask[];
  telegramActivity: [];
  alertPrefs?: OperatorAlertPrefs;
}

export function toExportTask(task: Task): ExportTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    assigneeId: task.assigneeId,
    assigneeName: task.assigneeName,
    status: task.status,
    dueDate: task.dueDate,
    updatedAt: task.updatedAt,
    createdAt: task.createdAt,
  };
}
