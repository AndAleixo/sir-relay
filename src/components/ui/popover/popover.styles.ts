/**
 * Family A — popover / select panels (locale, account, group, Select).
 * Open: duration-200 ease-out. Close: duration-300 ease-in (more noticeable exit).
 */
export const popoverStyles = {
  panel:
    "overflow-hidden rounded-button border border-[var(--border)] bg-surface-card py-0.5 shadow-lg transition-[opacity,transform]",
  panelMotionOpen: "duration-200 ease-out",
  panelMotionClose: "duration-300 ease-in",
  /** Anchored below trigger (header dropdowns). */
  panelDropdown: "absolute right-0 top-full z-50 mt-1",
  panelDropdownLeft: "absolute left-0 top-full z-50 mt-1",
  /** Full-width under form/filter triggers. */
  panelSelect:
    "absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto overscroll-contain",
  panelOpen: "translate-y-0 scale-100 opacity-100",
  panelClosed: "pointer-events-none translate-y-2 scale-[0.98] opacity-0",
  /** Form / filter trigger — same height as shell `headerControl` (h-9). */
  trigger:
    "inline-flex h-9 w-full min-h-9 items-center justify-between gap-2 rounded-button border border-[var(--border)] bg-surface-card px-3 text-sm text-[var(--text-primary)] outline-none transition-colors hover:border-brand-accent/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent disabled:pointer-events-none disabled:opacity-50",
  /** Option / menu row — compact, aligned with trigger height. */
  item: "flex min-h-9 w-full touch-manipulation items-center px-2.5 py-1.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-bg)] active:bg-[var(--surface-bg)]",
  itemActive:
    "bg-brand-accent-soft text-brand-accent hover:bg-brand-accent-soft hover:text-brand-accent",
} as const;
