export const taskCardStyles = {
  root: "relative block rounded-card border border-[var(--border)] bg-surface-card p-2 shadow-sm transition-colors",
  draggable: "flex gap-1 p-1.5",
  dragging: "opacity-40 ring-2 ring-brand-accent/40",
  dragHandle:
    "shrink-0 cursor-grab touch-none rounded px-0.5 text-xs leading-none text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] active:cursor-grabbing",
  boardBody: "relative min-w-0 flex-1",
  titleRow: "mb-2 flex items-start gap-2",
  titleButton:
    "line-clamp-2 flex-1 rounded-[4px] text-left text-[13px] font-medium leading-tight text-[var(--text-primary)] hover:text-brand-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30",
  openLink:
    "shrink-0 rounded p-0.5 text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 [&_svg]:h-3 [&_svg]:w-3",
  inlineInput: "h-7 px-2 py-0.5 text-[13px]",
  inlineDateInput: "h-6 w-full px-1.5 py-0 text-[11px]",
  dueButton:
    "truncate text-left text-[11px] leading-tight text-[var(--text-muted)] hover:text-brand-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 rounded-[4px]",
  meta: "shrink-0 text-[11px] leading-tight text-[var(--text-muted)]",
  footer: "mt-0.5 flex items-center justify-between gap-2",
  overdue: "font-medium text-[var(--danger)]",
  startDoing:
    "shrink-0 rounded p-0.5 text-brand-accent hover:bg-brand-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 disabled:opacity-50 [&_svg]:h-3.5 [&_svg]:w-3.5",
  /** In progress → Done (neutral; colour reserved for completed mark). */
  markDone:
    "shrink-0 rounded p-0.5 text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 disabled:opacity-50 [&_svg]:h-3.5 [&_svg]:w-3.5",
  /** Done column — same glyph, not interactive. */
  completedMark:
    "shrink-0 p-0.5 text-emerald-700 [&_svg]:h-3.5 [&_svg]:w-3.5",
  notifyDotCorner:
    "pointer-events-none absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-brand-accent",
} as const;
