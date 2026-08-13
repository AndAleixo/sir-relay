export const syncBarStyles = {
  root: "flex items-center justify-between gap-4 border-b px-4 py-2 text-sm",
  warning:
    "border-brand-accent/30 bg-brand-accent-soft text-[var(--text-primary)]",
  severity:
    "border-[var(--severity-soft-hover)] bg-[var(--severity-soft)] text-[var(--severity)]",
  message: "min-w-0 flex-1 text-center md:text-left",
  actions: "flex shrink-0 items-center gap-2",
  button: "h-8 px-3 text-xs",
} as const;
