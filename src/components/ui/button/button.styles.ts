/** Visual variants for Button — no business logic. */
export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-button px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

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
