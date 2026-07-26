import type { Locale, Role, Task, TaskStatus } from "@/domain/types";
import type { OperatorAlertPrefs } from "@/services/alert.types";

export type ExportScope = "full" | "user";

export interface ExportUser {
  name: string;
  email: string;
  role: Role;
  locale: Locale;
  active: boolean;
  /** Per-group fantasy label when set. */
  displayName?: string | null;
  accountStatus?: "invited" | "active";
  telegramStatus?: "linked" | "pending";
}

export interface ExportTask {
  title: string;
  description: string;
  assigneeName: string;
  status: TaskStatus;
  dueDate: string | null;
  updatedAt: string;
  createdAt: string;
}

/** Internal snapshot for CSV (Teammates export). */
export interface ExportPayload {
  exportedAt: string;
  scope: ExportScope;
  users: ExportUser[];
  tasks: ExportTask[];
  alertPrefs?: OperatorAlertPrefs;
}

export function toExportTask(task: Task): ExportTask {
  return {
    title: task.title,
    description: task.description,
    assigneeName: task.assigneeName,
    status: task.status,
    dueDate: task.dueDate,
    updatedAt: task.updatedAt,
    createdAt: task.createdAt,
  };
}

/** RFC4180 cell; Excel-friendly when file starts with UTF-8 BOM. */
export function csvCell(value: string | number | boolean | null | undefined): string {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function csvRow(cells: Array<string | number | boolean | null | undefined>): string {
  return cells.map(csvCell).join(",");
}

/** CSV for operators: Members + Tasks (+ Alert preferences when full). */
export function toExportCsv(data: ExportPayload): string {
  const lines: string[] = [
    csvRow(["Exported at", data.exportedAt]),
    csvRow(["Scope", data.scope]),
    "",
    "Members",
    csvRow([
      "Name",
      "Email",
      "Role",
      "Locale",
      "Active",
      "Display name",
      "Account",
      "Telegram",
    ]),
  ];

  for (const user of data.users) {
    lines.push(
      csvRow([
        user.name,
        user.email,
        user.role,
        user.locale,
        user.active,
        user.displayName ?? "",
        user.accountStatus ?? "",
        user.telegramStatus ?? "",
      ]),
    );
  }

  lines.push(
    "",
    "Tasks",
    csvRow([
      "Title",
      "Description",
      "Assignee",
      "Status",
      "Due date",
      "Created",
      "Updated",
    ]),
  );

  for (const task of data.tasks) {
    lines.push(
      csvRow([
        task.title,
        task.description,
        task.assigneeName,
        task.status,
        task.dueDate,
        task.createdAt,
        task.updatedAt,
      ]),
    );
  }

  if (data.alertPrefs) {
    const prefs = data.alertPrefs;
    lines.push(
      "",
      "Alert preferences",
      csvRow(["Task done", prefs.taskDone]),
      csvRow(["Task due", prefs.taskDue]),
      csvRow(["Timezone", prefs.timezone]),
      csvRow(["Quiet hours start", prefs.quietHoursStart ?? ""]),
      csvRow(["Quiet hours end", prefs.quietHoursEnd ?? ""]),
    );
  }

  // ponytail: UTF-8 BOM so Excel on Windows opens accents correctly
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
