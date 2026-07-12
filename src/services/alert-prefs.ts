import type { GroupAlertPrefs as DbGroupAlertPrefs } from "@prisma/client";
import { isInQuietHours } from "@/lib/group-timezones";
import type { OperatorAlertPrefs } from "@/services/alert.types";

export function toOperatorAlertPrefs(row: DbGroupAlertPrefs): OperatorAlertPrefs {
  return {
    taskDone: row.taskDone,
    taskDue: row.taskDue,
    timezone: row.timezone,
    quietHoursStart: row.quietHoursStart,
    quietHoursEnd: row.quietHoursEnd,
  };
}

export function telegramDeliveryAllowed(
  prefs: OperatorAlertPrefs,
  now = new Date(),
): boolean {
  return !isInQuietHours(
    now,
    prefs.timezone,
    prefs.quietHoursStart,
    prefs.quietHoursEnd,
  );
}
