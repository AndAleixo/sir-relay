export const teamListStyles = {
  tableWrap: "overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)]",
  table: "w-full min-w-[640px] text-left text-sm",
  th: "border-b border-[var(--border)] bg-[var(--surface-bg)] px-4 py-3 font-medium text-[var(--text-muted)]",
  td: "border-b border-[var(--border)] px-4 py-3 text-[var(--text-primary)]",
  iconTh: "w-0 text-center whitespace-nowrap",
  iconTd: "w-0 text-center whitespace-nowrap",
  trHover: "transition-colors hover:bg-[var(--surface-bg)]",
  userCell: "font-medium",
  nameLink:
    "text-brand-accent hover:text-brand-accent-hover focus-visible:outline-none focus-visible:underline",
  /** Same optical size as the tasks toolbar button (`viewToggleStyles.newTask`). */
  actionSize:
    "[&_button]:h-8 [&_button]:px-2.5 [&_button]:py-0 [&_button]:text-xs sm:[&_button]:h-9 sm:[&_button]:px-4 sm:[&_button]:text-sm",
} as const;
