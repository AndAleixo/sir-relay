import type { OperatorAlert, Session, Task } from "@/domain/types";
import {
  calendarDateInTimezone,
  isDueOnOrBeforeTodayInTimezone,
} from "@/lib/group-timezones";
import { requireOperator } from "@/lib/authz";
import type {
  OperatorAlertPrefs,
  OperatorAlertService,
} from "@/services/alert.types";
import { telegramDeliveryAllowed } from "@/services/alert-prefs";
import {
  getMembershipRole,
  userIdsInGroup,
} from "@/services/mock/groups.mock";
import { findMockUserById } from "@/services/mock/users.mock";
import { mockTaskService } from "@/services/mock/task.mock";

const prefsByGroup = new Map<string, OperatorAlertPrefs>();
const alerts: OperatorAlert[] = [];
const dueAlertKeys = new Set<string>();

function defaultPrefs(): OperatorAlertPrefs {
  return {
    taskDone: true,
    taskDue: true,
    timezone: "UTC",
    quietHoursStart: null,
    quietHoursEnd: null,
  };
}

function groupPrefs(groupId: string): OperatorAlertPrefs {
  let prefs = prefsByGroup.get(groupId);
  if (!prefs) {
    prefs = defaultPrefs();
    prefsByGroup.set(groupId, prefs);
  }
  return prefs;
}

function dueDayKey(groupId: string, timezone: string): string {
  return `${groupId}:${calendarDateInTimezone(new Date(), timezone)}`;
}

function isTeammateAssignee(groupId: string, assigneeId: string): boolean {
  return getMembershipRole(groupId, assigneeId) === "teammate";
}

function hasLinkedOperator(groupId: string): boolean {
  for (const userId of Array.from(userIdsInGroup(groupId))) {
    if (getMembershipRole(groupId, userId) !== "operator") continue;
    const user = findMockUserById(userId);
    if (user?.active && user.telegramStatus === "linked") return true;
  }
  return false;
}

function pushAlert(
  groupId: string,
  input: Omit<OperatorAlert, "id" | "createdAt" | "sentToTelegram">,
  now = new Date(),
) {
  const prefs = groupPrefs(groupId);
  const typeEnabled =
    (input.type === "task_done" && prefs.taskDone) ||
    (input.type === "task_due" && prefs.taskDue);
  if (!typeEnabled) return;

  alerts.unshift({
    ...input,
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now.toISOString(),
    sentToTelegram: hasLinkedOperator(groupId) && telegramDeliveryAllowed(prefs, now),
  });

  if (alerts.length > 50) {
    alerts.length = 50;
  }
}

function requireGroupId(ctx: { session: Session }): string {
  const groupId = ctx.session.activeGroupId;
  if (!groupId) throw new Error("No active group");
  return groupId;
}

function requireOperatorGroup(ctx: { session: Session }): string {
  return requireOperator(ctx.session);
}

export class MockOperatorAlertService implements OperatorAlertService {
  async getPrefs(ctx: { session: Session }): Promise<OperatorAlertPrefs> {
    return { ...groupPrefs(requireOperatorGroup(ctx)) };
  }

  async updatePrefs(
    ctx: { session: Session },
    next: Partial<OperatorAlertPrefs>,
  ): Promise<OperatorAlertPrefs> {
    const groupId = requireOperatorGroup(ctx);
    const prefs = { ...groupPrefs(groupId), ...next };
    prefsByGroup.set(groupId, prefs);
    return { ...prefs };
  }

  async listRecentAlerts(
    ctx: { session: Session },
    limit = 8,
  ): Promise<OperatorAlert[]> {
    requireOperatorGroup(ctx);
    const taskIds = new Set(
      (await mockTaskService.listTasks(ctx)).map((task) => task.id),
    );
    return alerts.filter((alert) => taskIds.has(alert.taskId)).slice(0, limit);
  }

  async notifyTaskDone(task: Task, ctx: { session: Session }): Promise<void> {
    const groupId = requireGroupId(ctx);
    if (!isTeammateAssignee(groupId, task.assigneeId)) return;

    pushAlert(groupId, {
      type: "task_done",
      taskId: task.id,
      taskTitle: task.title,
      assigneeName: task.assigneeName,
      dueDate: task.dueDate,
    });
  }

  async syncDueAlerts(tasks: Task[], ctx: { session: Session }): Promise<void> {
    const groupId = requireGroupId(ctx);
    const prefs = groupPrefs(groupId);
    const now = new Date();
    const day = dueDayKey(groupId, prefs.timezone);

    for (const task of tasks) {
      if (task.status === "done") continue;
      if (!isTeammateAssignee(groupId, task.assigneeId)) continue;
      if (!task.dueDate || !isDueOnOrBeforeTodayInTimezone(task.dueDate, prefs.timezone, now)) {
        continue;
      }

      const dedupeKey = `${day}:${task.id}`;
      if (dueAlertKeys.has(dedupeKey)) continue;
      dueAlertKeys.add(dedupeKey);

      pushAlert(
        groupId,
        {
          type: "task_due",
          taskId: task.id,
          taskTitle: task.title,
          assigneeName: task.assigneeName,
          dueDate: task.dueDate,
        },
        now,
      );
    }
  }
}

export const mockOperatorAlertService = new MockOperatorAlertService();
