import type { TaskStatus } from "@/domain/types";

export const kanbanStyles = {
  grid: "grid gap-4 md:grid-cols-3",
  column: "flex min-h-[200px] flex-col rounded-card border border-[var(--border)] bg-[var(--surface-bg)]/50 transition-shadow",
  columnDropTarget: "bg-brand-accent-soft/12 ring-2 ring-inset ring-brand-accent/40",
  columnHeader: {
    todo: "flex items-center justify-between border-b border-[var(--border)] bg-surface-card px-3 py-2.5 rounded-t-card",
    doing:
      "flex items-center justify-between border-b border-brand-accent/30 bg-brand-accent-soft px-3 py-2.5 rounded-t-card",
    done: "flex items-center justify-between border-b border-[var(--border)] bg-surface-card px-3 py-2.5 rounded-t-card",
  } satisfies Record<TaskStatus, string>,
  columnTitle: "text-sm font-semibold text-[var(--text-primary)]",
  count: "text-xs font-medium text-[var(--text-muted)]",
  cardList: "flex flex-col gap-2 p-2",
} as const;
