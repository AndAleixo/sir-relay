import type { OperatorAlert, Session, Task } from "@/domain/types";

export interface OperatorAlertPrefs {
  taskDone: boolean;
  taskDue: boolean;
}

export interface OperatorAlertService {
  getPrefs(ctx: { session: Session }): Promise<OperatorAlertPrefs>;
  updatePrefs(
    ctx: { session: Session },
    prefs: Partial<OperatorAlertPrefs>,
  ): Promise<OperatorAlertPrefs>;
  listRecentAlerts(ctx: { session: Session }, limit?: number): Promise<OperatorAlert[]>;
  notifyTaskDone(task: Task, ctx: { session: Session }): Promise<void>;
  syncDueAlerts(tasks: Task[], ctx: { session: Session }): Promise<void>;
}
