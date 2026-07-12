/** Curated IANA zones for group alert scheduling. */
export const groupTimezones = [
  "UTC",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Madrid",
  "America/Sao_Paulo",
] as const;

export type GroupTimezone = (typeof groupTimezones)[number];

export function isGroupTimezone(value: string): value is GroupTimezone {
  return (groupTimezones as readonly string[]).includes(value);
}

export function hourInTimezone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  return hour === 24 ? 0 : hour;
}

export function calendarDateInTimezone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/** Quiet window may wrap midnight (e.g. 22 → 8). Null start/end = disabled. */
export function isInQuietHours(
  date: Date,
  timeZone: string,
  startHour: number | null,
  endHour: number | null,
): boolean {
  if (startHour == null || endHour == null) return false;
  if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) return false;
  if (startHour === endHour) return false;

  const hour = hourInTimezone(date, timeZone);
  if (startHour < endHour) {
    return hour >= startHour && hour < endHour;
  }
  return hour >= startHour || hour < endHour;
}

export function isDueOnOrBeforeTodayInTimezone(
  dueDate: string,
  timeZone: string,
  now = new Date(),
): boolean {
  const today = calendarDateInTimezone(now, timeZone);
  return dueDate <= today;
}
