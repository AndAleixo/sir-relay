export const taskCardStyles = {
  // min-w-0: long description/title must not widen the column (esp. mobile stack).
  root: "relative block min-w-0 max-w-full overflow-visible rounded-card border border-[var(--border)] bg-surface-card shadow-sm transition-colors",
  /** Row layout: default cursor + no text select; move via dragHandle; board pan outside cards. */
  layout: "flex cursor-default gap-1 p-1 select-none",
  dragging: "opacity-40 ring-2 ring-brand-accent/40",
  dragHandle:
    "shrink-0 cursor-grab touch-none rounded px-0.5 text-[10px] leading-none text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] active:cursor-grabbing",
  /** Soft tint on drag handle when task has difficulty (tokens: brand.css). */
  dragHandleEasy:
    "bg-[var(--difficulty-easy-bg)] text-[var(--difficulty-easy-fg)] hover:bg-[var(--difficulty-easy-bg-hover)]",
  dragHandleMedium:
    "bg-[var(--difficulty-medium-bg)] text-[var(--difficulty-medium-fg)] hover:bg-[var(--difficulty-medium-bg-hover)]",
  dragHandleHard:
    "bg-[var(--difficulty-hard-bg)] text-[var(--difficulty-hard-fg)] hover:bg-[var(--difficulty-hard-bg-hover)]",
  /** Light inset so read-only titles aren’t flush left (narrower than the ⠿ handle). */
  dragHandleSpacer: "inline-block w-1.5 shrink-0 rounded",
  dragHandleSpacerEasy: "bg-[var(--difficulty-easy-bg-hover)]",
  dragHandleSpacerMedium: "bg-[var(--difficulty-medium-bg-hover)]",
  dragHandleSpacerHard: "bg-[var(--difficulty-hard-bg-hover)]",
  readOnly: "opacity-90",
  titleReadonly:
    "line-clamp-2 min-w-0 flex-1 text-left text-xs font-medium leading-snug text-[var(--text-primary)]",
  dueReadonly: "text-left text-[10px] text-[var(--text-muted)]",
  boardBody: "relative min-w-0 flex-1 overflow-visible",
  titleRow: "mb-0.5 flex min-w-0 items-start gap-1",
  acronymRoot: "relative z-10 inline-flex items-center align-baseline",
  projectPickerShell: "relative z-10 min-w-0 flex-1",
  acronymSep:
    "mx-1 text-xs font-medium leading-snug text-[var(--text-primary)]",
  acronymButton:
    "inline-flex cursor-pointer items-center rounded-[4px] p-0 text-xs font-medium leading-snug text-[var(--text-primary)] hover:text-brand-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30",
  titleTextButton:
    "cursor-pointer text-left text-xs font-medium leading-snug text-[var(--text-primary)] hover:text-brand-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30",
  titleButton:
    "line-clamp-2 min-w-0 flex-1 cursor-pointer rounded-[4px] text-left text-xs font-medium leading-snug text-[var(--text-primary)] hover:text-brand-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30",
  /** Under title when due is set — slight inset so it doesn’t run under status icons. */
  descriptionPreview:
    "mb-0.5 block min-w-0 max-w-full truncate pr-2 text-left text-[10px] leading-tight text-[var(--text-muted)]",
  /** In footer when no due — uses the due slot width (menu stays on the right). */
  descriptionInFooter:
    "block min-w-0 max-w-full truncate text-left text-[10px] leading-tight text-[var(--text-muted)]",
  inlineInput: "h-6 select-text px-1.5 py-0 text-xs",
  inlineDateInput: "h-5 w-full select-text px-1 py-0 text-[10px]",
  dueButton:
    "truncate text-left text-[10px] leading-tight text-[var(--text-muted)] hover:text-brand-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 rounded-[4px]",
  footer: "relative flex min-w-0 items-center justify-between gap-1 overflow-visible",
  overdue: "font-medium text-[var(--severity)]",
  startDoing:
    "shrink-0 rounded p-0.5 text-[#F5C518] hover:bg-brand-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 disabled:opacity-50 [&_svg]:h-3 [&_svg]:w-3",
  /** In progress → Done (neutral; colour reserved for completed mark). */
  markDone:
    "shrink-0 rounded p-0.5 text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 disabled:opacity-50 [&_svg]:h-3 [&_svg]:w-3",
  /** Done column — same glyph, not interactive. */
  completedMark:
    "shrink-0 p-0.5 text-emerald-600 [&_svg]:h-3 [&_svg]:w-3",
  /** ⋯ stays put; overlay is inset to the footer row so it shares the trigger line. */
  menuRoot: "relative z-10 shrink-0 self-stretch",
  menuButton:
    "flex h-full items-center rounded-[4px] px-1 text-[11px] leading-none text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 disabled:opacity-50",
  menuButtonOpen: "bg-[var(--surface-bg)] text-[var(--text-primary)]",
  menuSegment:
    "absolute inset-y-0 right-full z-20 flex items-center gap-0.5 rounded-[4px] bg-surface-card px-0.5 transition-[opacity,transform]",
  menuSegmentOpen: "translate-x-0 opacity-100 duration-200 ease-out",
  menuSegmentClosed:
    "pointer-events-none translate-x-2 opacity-0 duration-300 ease-in",
  menuItem:
    "rounded-[4px] bg-surface-card px-1.5 py-0.5 text-[10px] font-medium leading-tight text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 disabled:opacity-50",
  /** Footer due / description — fade under ⋯ overlay (not visibility snap). */
  footerSlot: "min-w-0 flex-1 transition-opacity duration-200 ease-out",
  footerSlotHidden: "pointer-events-none opacity-30 duration-300 ease-in",
  menuItemSeverity:
    "text-[var(--severity)] hover:bg-[var(--surface-bg)] hover:text-[var(--severity)]",
  /** Same fade/slide as ⋯; inset to the acronym line. */
  projectSegment:
    "absolute inset-y-0 left-full z-20 flex items-center gap-0.5 rounded-[4px] bg-surface-card px-0.5 transition-[opacity,transform]",
  projectSegmentStretch: "overflow-hidden",
  projectSegmentHug: "w-max",
  projectSegmentClosed:
    "pointer-events-none -translate-x-2 opacity-0 duration-300 ease-in",
  projectScroller: "min-w-0 flex-1 overflow-hidden",
  projectScrollerRow: "flex w-max items-center gap-0.5",
  projectMenuItem: "shrink-0 whitespace-nowrap py-0 text-xs leading-snug",
  projectScrollArrow:
    "absolute top-1/2 z-10 -translate-y-1/2 rounded-[4px] bg-surface-card px-0.5 py-0.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 [&_svg]:h-3 [&_svg]:w-3",
  projectScrollArrowLeft: "left-0",
  projectScrollArrowRight: "right-0",
  notifyDotCorner:
    "pointer-events-none absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-brand-accent",
} as const;
