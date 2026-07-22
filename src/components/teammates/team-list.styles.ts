export const teamListStyles = {
  tableWrap: "overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)]",
  table: "w-full min-w-[480px] text-left text-sm",
  th: "border-b border-[var(--border)] bg-[var(--surface-bg)] px-4 py-3 font-medium text-[var(--text-muted)]",
  td: "border-b border-[var(--border)] px-4 py-3 text-[var(--text-primary)]",
  trHover: "transition-colors hover:bg-[var(--surface-bg)]",
  userCell: "font-medium",
} as const;
