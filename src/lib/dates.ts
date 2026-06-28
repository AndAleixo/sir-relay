const DAY_MS = 86_400_000;

export function isDueOrOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(`${dueDate}T00:00:00Z`).getTime();
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  return due <= todayUtc;
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(`${dueDate}T00:00:00Z`).getTime();
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  return due < todayUtc;
}

export function formatRelativeTime(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(locale);
}

export function formatDueDate(dueDate: string | null, locale: string): string {
  if (!dueDate) return "—";
  return new Date(`${dueDate}T00:00:00Z`).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function groupTasksByStatus<T extends { status: string }>(
  tasks: T[],
): Record<"todo" | "doing" | "done", T[]> {
  return {
    todo: tasks.filter((t) => t.status === "todo"),
    doing: tasks.filter((t) => t.status === "doing"),
    done: tasks.filter((t) => t.status === "done"),
  };
}

export { DAY_MS };
