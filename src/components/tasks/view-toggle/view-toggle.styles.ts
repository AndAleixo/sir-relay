export const viewToggleStyles = {
  toolbar:
    "mb-4 flex flex-wrap items-center justify-between gap-3",
  toolbarText: "min-w-0 text-sm text-[var(--text-muted)]",
  toolbarStart: "flex flex-wrap items-center gap-2",
  root: "inline-flex shrink-0 rounded-button border border-[var(--border)] bg-surface-card p-0.5",
  button:
    "rounded-[5px] px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]",
  buttonActive: "bg-[var(--surface-bg)] text-[var(--text-primary)] shadow-sm",
} as const;
