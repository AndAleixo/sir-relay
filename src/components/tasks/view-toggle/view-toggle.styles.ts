export const viewToggleStyles = {
  toolbar:
    "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
  hint: "text-xs leading-relaxed text-[var(--text-muted)] sm:max-w-md sm:text-right",
  root: "inline-flex shrink-0 rounded-button border border-[var(--border)] bg-surface-card p-0.5",
  button:
    "rounded-[5px] px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]",
  buttonActive: "bg-[var(--surface-bg)] text-[var(--text-primary)] shadow-sm",
} as const;
