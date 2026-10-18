export const taskListStyles = {
  wrapper: "rounded-card border border-[var(--border)] bg-surface-card",
  cols: "md:grid md:grid-cols-[minmax(8rem,2fr)_repeat(4,minmax(4.5rem,1fr))_minmax(9rem,10.5rem)] md:items-start md:gap-3",
  headRow:
    "hidden border-b border-[var(--border)] bg-[var(--surface-bg)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] md:grid",
  row: "grid grid-cols-1 gap-1 border-b border-[var(--border)] px-3 py-2 text-xs last:border-0 hover:bg-[var(--surface-bg)]/60 md:gap-3",
  meta: "flex flex-wrap items-center gap-x-3 gap-y-1 md:contents",
  cell: "min-w-0",
  cellDue: "min-w-0 whitespace-nowrap tabular-nums md:pt-0.5",
  /** Same token + weight as task card due (`taskCardStyles.overdue`). */
  dueOverdue: "font-medium text-[var(--severity)]",
  link: "line-clamp-2 font-medium text-[var(--text-primary)] hover:text-brand-accent-hover",
  cellTrigger:
    "max-w-full rounded-[4px] text-left hover:text-brand-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30",
  titleTrigger: "line-clamp-2 whitespace-normal",
  cellValue: "font-medium text-[var(--text-primary)]",
  cellEmpty: "font-normal text-[var(--text-muted)]",
  cellTriggerOpen: "text-brand-accent",
  picker: "relative max-w-full",
  pickerPanel: "z-50 min-w-[8rem] max-w-[16rem]",
  inlineInput: "min-h-0 resize-none py-1 text-xs leading-snug",
  inlineDate: "h-7 w-full min-w-0 max-w-[11rem] py-0 text-xs",
  /** One row: same value-first Select chrome as toolbar Project. Sort sits right. */
  filterBar: "flex flex-nowrap items-center gap-1.5 sm:gap-2",
  filterField: "min-w-0 flex-1 sm:w-auto sm:min-w-[7.25rem] sm:flex-none",
  filterFieldWide: "min-w-0 flex-1 sm:w-auto sm:min-w-[8.5rem] sm:flex-none",
  filterFieldSort: "ml-auto",
  filterSelect: "relative z-10 min-w-0 w-full",
  /** Same chrome as toolbar Project select. */
  filterTrigger:
    "h-8 min-h-8 w-full gap-1 px-2 text-xs sm:h-9 sm:min-h-9 sm:gap-2 sm:px-3 sm:text-sm",
  filterAdd: "self-center text-xs text-[var(--text-muted)]",
} as const;
