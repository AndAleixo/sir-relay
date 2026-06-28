import type { OperatorAlert, Task } from "@/domain/types";
import { isDueOrOverdue } from "@/lib/dates";
import type {
  OperatorAlertPrefs,
  OperatorAlertService,
} from "@/services/alert.types";
import { MOCK_OPERATORS, MOCK_TEAMMATES } from "@/services/mock/data";

const teammateIds = new Set(MOCK_TEAMMATES.map((t) => t.id));

let prefs: OperatorAlertPrefs = {
  taskDone: true,
  taskDue: true,
};

const alerts: OperatorAlert[] = [];
const dueAlertKeys = new Set<string>();

function todayKey(): string {
  const today = new Date();
  return `${today.getUTCFullYear()}-${today.getUTCMonth()}-${today.getUTCDate()}`;
}

function hasLinkedOperator(): boolean {
  return MOCK_OPERATORS.some(
    (op) => op.active && op.telegramStatus === "linked",
  );
}

function pushAlert(input: Omit<OperatorAlert, "id" | "createdAt" | "sentToTelegram">) {
  const typeEnabled =
    (input.type === "task_done" && prefs.taskDone) ||
    (input.type === "task_due" && prefs.taskDue);
  if (!typeEnabled) return;

  alerts.unshift({
    ...input,
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    sentToTelegram: hasLinkedOperator(),
  });

  if (alerts.length > 50) {
    alerts.length = 50;
  }
}

export class MockOperatorAlertService implements OperatorAlertService {
  async getPrefs(): Promise<OperatorAlertPrefs> {
    return { ...prefs };
  }

  async updatePrefs(next: Partial<OperatorAlertPrefs>): Promise<OperatorAlertPrefs> {
    prefs = { ...prefs, ...next };
    return { ...prefs };
  }

  async listRecentAlerts(limit = 8): Promise<OperatorAlert[]> {
    return alerts.slice(0, limit);
  }

  async notifyTaskDone(task: Task): Promise<void> {
    if (!teammateIds.has(task.assigneeId)) return;

    pushAlert({
      type: "task_done",
      taskId: task.id,
      taskTitle: task.title,
      assigneeName: task.assigneeName,
      dueDate: task.dueDate,
    });
  }

  async syncDueAlerts(tasks: Task[]): Promise<void> {
    const day = todayKey();

    for (const task of tasks) {
      if (task.archived || task.status === "done") continue;
      if (!teammateIds.has(task.assigneeId)) continue;
      if (!task.dueDate || !isDueOrOverdue(task.dueDate)) continue;

      const dedupeKey = `${day}:${task.id}`;
      if (dueAlertKeys.has(dedupeKey)) continue;
      dueAlertKeys.add(dedupeKey);

      pushAlert({
        type: "task_due",
        taskId: task.id,
        taskTitle: task.title,
        assigneeName: task.assigneeName,
        dueDate: task.dueDate,
      });
    }
  }
}

export const mockOperatorAlertService = new MockOperatorAlertService();
