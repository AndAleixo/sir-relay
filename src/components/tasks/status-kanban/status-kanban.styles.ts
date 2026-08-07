import type { TaskStatus } from "@/domain/types";

/**
 * Mobile chrome above the kanban (top bar + tabs + content pad + toolbar).
 * Keep in sync with MobileTopBar + tasks toolbar; prefer flex-fill shell if this drifts.
 */
export const MY_WORK_MOBILE_CHROME = "13rem";

export const kanbanStyles = {
  // Mobile: fill remaining viewport with 3 equal rows; cards scroll inside columns.
  grid: `grid gap-3 md:grid-cols-3 md:gap-4 max-md:h-[calc(100dvh-${MY_WORK_MOBILE_CHROME})] max-md:grid-rows-3`,
  column:
    "flex min-h-0 flex-col rounded-card border border-[var(--border)] bg-[var(--surface-bg)]/50 transition-shadow md:min-h-[200px]",
  columnDropTarget: "bg-brand-accent-soft/12 ring-2 ring-inset ring-brand-accent/40",
  columnHeader: {
    todo: "flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-surface-card px-3 py-2.5 rounded-t-card",
    doing:
      "flex shrink-0 items-center justify-between border-b border-brand-accent/30 bg-brand-accent-soft px-3 py-2.5 rounded-t-card",
    done: "flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-surface-card px-3 py-2.5 rounded-t-card",
  } satisfies Record<TaskStatus, string>,
  columnTitle: "text-sm font-semibold text-[var(--text-primary)]",
  count: "text-xs font-medium text-[var(--text-muted)]",
  cardList:
    "flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-y-contain p-1.5 [scrollbar-gutter:stable] [scrollbar-width:thin]",
  showMore:
    "w-full cursor-pointer px-2 py-1 text-center text-xs text-brand-accent-hover hover:underline",
} as const;
