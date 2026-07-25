export const taskCardStyles = {
  root: "relative block rounded-card border border-[var(--border)] bg-surface-card shadow-sm transition-colors",
  /** Row layout: default cursor + no text select; move via dragHandle; board pan outside cards. */
  layout: "flex cursor-default gap-0.5 p-1 select-none",
  dragging: "opacity-40 ring-2 ring-brand-accent/40",
  dragHandle:
    "shrink-0 cursor-grab touch-none rounded px-0.5 text-[10px] leading-none text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] active:cursor-grabbing",
  /** Light inset so read-only titles aren’t flush left (narrower than the ⠿ handle). */
  dragHandleSpacer: "inline-block w-1.5 shrink-0",
  readOnly: "opacity-90",
  titleReadonly:
    "line-clamp-2 min-w-0 flex-1 text-left text-xs font-medium leading-snug text-[var(--text-primary)]",
  dueReadonly: "text-left text-[10px] text-[var(--text-muted)]",
  boardBody: "relative min-w-0 flex-1",
  titleRow: "mb-0.5 flex items-start gap-1",
  titleButton:
    "line-clamp-2 flex-1 cursor-pointer rounded-[4px] text-left text-xs font-medium leading-snug text-[var(--text-primary)] hover:text-brand-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30",
  inlineInput: "h-6 select-text px-1.5 py-0 text-xs",
  inlineDateInput: "h-5 w-full select-text px-1 py-0 text-[10px]",
  dueButton:
    "truncate text-left text-[10px] leading-tight text-[var(--text-muted)] hover:text-brand-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 rounded-[4px]",
  footer: "flex items-center justify-between gap-1",
  overdue: "font-medium text-[var(--danger)]",
  startDoing:
    "shrink-0 rounded p-0.5 text-[#F5C518] hover:bg-brand-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 disabled:opacity-50 [&_svg]:h-3 [&_svg]:w-3",
  /** In progress → Done (neutral; colour reserved for completed mark). */
  markDone:
    "shrink-0 rounded p-0.5 text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 disabled:opacity-50 [&_svg]:h-3 [&_svg]:w-3",
  /** Done column — same glyph, not interactive. */
  completedMark:
    "shrink-0 p-0.5 text-emerald-600 [&_svg]:h-3 [&_svg]:w-3",
  menuRoot: "relative shrink-0",
  menuButton:
    "rounded px-0.5 py-0 text-[11px] leading-none text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 disabled:opacity-50",
  menuButtonOpen: "bg-[var(--surface-bg)] text-[var(--text-primary)]",
  /** Anchored to the side of ⋯ — sits left, vertically aligned with the trigger. */
  menuPanel:
    "absolute right-full top-1/2 z-20 mr-0.5 -translate-y-1/2 rounded-md border border-[var(--border)] bg-surface-card py-0.5",
  menuItem:
    "block w-full whitespace-nowrap px-2 py-1 text-left text-[11px] leading-tight text-[var(--text-primary)] hover:bg-[var(--surface-bg)] focus-visible:bg-[var(--surface-bg)] focus-visible:outline-none",
  menuItemDanger: "text-[var(--danger)]",
  notifyDotCorner:
    "pointer-events-none absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-brand-accent",
} as const;
