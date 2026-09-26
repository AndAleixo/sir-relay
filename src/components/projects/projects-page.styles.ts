export const projectsPageStyles = {
  toolbar: "mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between",
  hint: "min-w-0 text-sm text-[var(--text-muted)]",
  form: "flex w-full min-w-0 flex-wrap items-end gap-2 lg:w-auto lg:max-w-xl",
  formName: "min-w-[9rem] flex-1",
  formAcronym: "w-[4.75rem] shrink-0",
  pending: "mb-4 rounded-card border border-dashed border-[var(--border)] bg-surface-card p-4",
  pendingList: "mt-3 grid gap-2 sm:grid-cols-2",
  pendingRow:
    "flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-bg)] px-3 py-2",
  grid: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
  iconBtnDanger:
    "rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--severity)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30",
  catsHead: "flex items-baseline justify-between gap-2",
  catsLabel: "text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]",
  chips: "flex flex-wrap gap-1.5",
  chip: "inline-flex max-w-full items-center gap-0.5 rounded-md bg-[var(--surface-bg)] py-1 pl-2.5 pr-1 text-xs font-medium text-[var(--text-primary)] ring-1 ring-[var(--border)]",
  chipLabel: "min-w-0 truncate",
  empty:
    "rounded-card border border-dashed border-[var(--border)] bg-surface-card p-8 text-center text-sm text-[var(--text-muted)]",
} as const;
