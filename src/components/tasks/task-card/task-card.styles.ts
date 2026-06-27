export const taskCardStyles = {
  root: "block rounded-card border border-[var(--border)] bg-surface-card p-3 shadow-sm transition-colors",
  hover: "hover:border-[var(--gray-strong)]/30 hover:shadow-md",
  draggable: "flex gap-2 p-2",
  dragging: "opacity-40 ring-2 ring-brand-accent/40",
  dragHandle:
    "mt-0.5 shrink-0 cursor-grab touch-none rounded px-1 text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] active:cursor-grabbing",
  cardLink: "min-w-0 flex-1 rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30",
  title: "line-clamp-2 text-sm font-medium leading-snug text-[var(--text-primary)]",
  meta: "text-xs text-[var(--text-muted)]",
  footer: "mt-2 flex flex-col gap-0.5",
  overdue: "font-medium text-[var(--danger)]",
  notifyDot: "mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-accent",
} as const;
