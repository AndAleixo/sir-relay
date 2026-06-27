export const taskListStyles = {
  wrapper: "overflow-x-auto rounded-card border border-[var(--border)] bg-surface-card",
  table: "w-full min-w-[640px] text-left text-sm",
  headRow: "border-b border-[var(--border)] bg-[var(--surface-bg)]",
  th: "px-4 py-3 font-medium text-[var(--text-muted)]",
  row: "border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-bg)]/60",
  td: "px-4 py-3",
  tdMuted: "px-4 py-3 text-[var(--text-muted)]",
  tdDanger: "px-4 py-3 font-medium text-[var(--danger)]",
  link: "font-medium text-[var(--text-primary)] hover:text-brand-accent-hover",
} as const;
