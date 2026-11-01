/** Visual variants for Button — no business logic. */
export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-button px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

/** App chrome: h-8 / text-xs, sm+ h-9 / text-sm. Overrides buttonBase padding. */
export const buttonCompact =
  "h-8 px-2.5 py-0 text-xs sm:h-9 sm:px-4 sm:text-sm";

export const buttonVariants = {
  primary:
    "bg-brand-accent text-[var(--text-primary)] hover:bg-brand-accent-hover",
  secondary:
    "border border-[var(--border)] bg-surface-card text-[var(--text-primary)] hover:bg-[var(--surface-bg)]",
  ghost:
    "text-[var(--text-primary)] hover:bg-[var(--surface-bg)]",
  severity:
    "bg-[var(--severity)] text-white hover:opacity-90",
} as const;
