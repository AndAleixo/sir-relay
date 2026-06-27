export const viewToggleStyles = {
  root: "inline-flex rounded-button border border-[var(--border)] bg-surface-card p-0.5",
  button:
    "rounded-[5px] px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]",
  buttonActive: "bg-[var(--surface-bg)] text-[var(--text-primary)] shadow-sm",
} as const;
