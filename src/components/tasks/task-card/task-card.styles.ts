export const taskCardStyles = {
  root: "relative block rounded-card border border-[var(--border)] bg-surface-card p-2 shadow-sm transition-colors",
  /** Row layout: default cursor + no text select; move via dragHandle; board pan outside cards. */
  layout: "flex cursor-default gap-1 p-1.5 select-none",
  dragging: "opacity-40 ring-2 ring-brand-accent/40",
  dragHandle:
    "shrink-0 cursor-grab touch-none rounded px-0.5 text-xs leading-none text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] active:cursor-grabbing",
  /** Light inset so read-only titles aren’t flush left (narrower than the ⠿ handle). */
  dragHandleSpacer: "inline-block w-2 shrink-0",
  readOnly: "opacity-90",
  titleReadonly:
    "line-clamp-2 min-w-0 flex-1 text-left text-[13px] font-medium leading-tight text-[var(--text-primary)]",
  dueReadonly: "text-left text-xs text-[var(--text-muted)]",
  boardBody: "relative min-w-0 flex-1",
  titleRow: "mb-2 flex items-start gap-2",
  titleButton:
    "line-clamp-2 flex-1 cursor-pointer rounded-[4px] text-left text-[13px] font-medium leading-tight text-[var(--text-primary)] hover:text-brand-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30",
  inlineInput: "h-7 select-text px-2 py-0.5 text-[13px]",
  inlineDateInput: "h-6 w-full select-text px-1.5 py-0 text-[11px]",
  dueButton:
    "truncate text-left text-[11px] leading-tight text-[var(--text-muted)] hover:text-brand-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 rounded-[4px]",
  footer: "mt-0.5 flex items-center justify-between gap-2",
  overdue: "font-medium text-[var(--danger)]",
  startDoing:
    "shrink-0 rounded p-0.5 text-[#F5C518] hover:bg-brand-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 disabled:opacity-50 [&_svg]:h-3.5 [&_svg]:w-3.5",
  /** In progress → Done (neutral; colour reserved for completed mark). */
  markDone:
    "shrink-0 rounded p-0.5 text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 disabled:opacity-50 [&_svg]:h-3.5 [&_svg]:w-3.5",
  /** Done column — same glyph, not interactive. */
  completedMark:
    "shrink-0 p-0.5 text-emerald-600 [&_svg]:h-3.5 [&_svg]:w-3.5",
  menuRoot: "relative shrink-0",
  menuButton:
    "rounded px-1 py-0.5 text-xs leading-none text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 disabled:opacity-50",
  menuPanel:
    "absolute right-0 bottom-full z-20 mb-1 min-w-[9rem] rounded-card border border-[var(--border)] bg-surface-card py-1 shadow-sm",
  menuItem:
    "block w-full px-3 py-1.5 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--surface-bg)] focus-visible:bg-[var(--surface-bg)] focus-visible:outline-none",
  menuItemDanger: "text-[var(--danger)]",
  notifyDotCorner:
    "pointer-events-none absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-brand-accent",
} as const;
