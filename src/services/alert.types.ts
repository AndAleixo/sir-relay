import type { OperatorAlert, Task } from "@/domain/types";

export interface OperatorAlertPrefs {
  taskDone: boolean;
  taskDue: boolean;
}

export interface OperatorAlertService {
  getPrefs(): Promise<OperatorAlertPrefs>;
  updatePrefs(prefs: Partial<OperatorAlertPrefs>): Promise<OperatorAlertPrefs>;
  listRecentAlerts(limit?: number): Promise<OperatorAlert[]>;
  notifyTaskDone(task: Task): Promise<void>;
  syncDueAlerts(tasks: Task[]): Promise<void>;
}
