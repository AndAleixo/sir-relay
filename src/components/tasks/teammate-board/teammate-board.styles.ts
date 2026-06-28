export const teamBoardStyles = {
  scroll:
    "flex cursor-grab gap-4 overflow-x-auto overscroll-x-contain pb-4 select-none touch-pan-y [scrollbar-gutter:stable] snap-x snap-mandatory md:snap-none",
  column:
    "flex w-[min(100%,280px)] shrink-0 snap-center flex-col rounded-card border border-[var(--border)] bg-surface-card md:w-72",
  columnHeader: "space-y-2 border-b border-[var(--border)] p-3",
  teammateName: "text-base font-semibold text-[var(--text-primary)] hover:text-brand-accent-hover",
  badges: "flex flex-wrap gap-1.5",
  activeCount: "text-xs text-[var(--text-muted)]",
  section: "border-b border-[var(--border)] p-2 last:border-b-0 min-h-[3rem] transition-shadow",
  sectionDropTarget: "bg-brand-accent-soft/40 ring-2 ring-inset ring-brand-accent/40",
  sectionTitle: "mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-primary)]",
  sectionTitleAccent:
    "mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-primary)]",
  cardList: "flex flex-col gap-2",
  doneSection: "p-2",
  doneToggle:
    "flex w-full items-center gap-2 rounded-button px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-bg)]",
  viewAll: "px-2 py-1 text-center text-xs text-brand-accent-hover",
  dropTarget: "ring-2 ring-brand-accent/50 ring-offset-2 ring-offset-surface-card",
  dragHint:
    "mb-3 rounded-card border border-dashed border-[var(--border)] bg-surface-card px-3 py-2 text-xs text-[var(--text-muted)]",
} as const;
