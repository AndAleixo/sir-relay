export const TOAST_DURATION_MS = 3000;

export const toastStyles = {
  host: "pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 md:inset-x-auto md:bottom-4 md:right-4 md:max-w-sm",
  panel:
    "pointer-events-auto flex items-center gap-2 rounded-card border border-[var(--border)] bg-surface-card px-4 py-3 text-sm text-[var(--text-primary)] shadow-sm transition-[opacity,transform]",
  message: "min-w-0 flex-1",
  close: "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-button text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
} as const;
