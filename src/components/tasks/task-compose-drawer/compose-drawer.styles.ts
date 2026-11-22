import { popoverStyles } from "@/components/ui/popover";

/** Bottom sheet compose — hug content; Family A open/close from bottom. */
export const composeDrawerStyles = {
  root: "fixed inset-0 z-[45] flex items-end justify-center sm:px-4",
  backdrop: "absolute inset-0 bg-[var(--text-primary)]/15 transition-opacity",
  backdropMotionOpen: popoverStyles.panelMotionOpen,
  backdropMotionClose: popoverStyles.panelMotionClose,
  backdropOpen: "opacity-100",
  backdropClosed: "pointer-events-none opacity-0",
  panel: [
    "relative z-[1] flex w-full max-w-lg max-h-[min(85vh,40rem)] flex-col overflow-hidden",
    "rounded-t-2xl border border-b-0 border-[var(--border)] bg-surface-card",
    "shadow-[0_-16px_48px_-16px_rgba(0,0,0,0.2)]",
    "transition-[opacity,transform]",
  ].join(" "),
  panelMotionOpen: popoverStyles.panelMotionOpen,
  panelMotionClose: popoverStyles.panelMotionClose,
  panelOpen: "translate-y-0 scale-100 opacity-100",
  panelClosed: "pointer-events-none translate-y-4 scale-[0.98] opacity-0",
  header:
    "flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3",
  title: "text-base font-semibold tracking-tight text-[var(--text-primary)]",
  closeBtn:
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  body: "min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3",
  bodyHug: "space-y-3 px-4 py-3",
  footer:
    "flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--border)] bg-surface-card px-4 py-3",
  chat:
    "flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-bg)]/70 p-2 pl-3 focus-within:border-brand-accent/50 focus-within:ring-2 focus-within:ring-brand-accent/15",
  chatInput:
    "max-h-40 min-h-[1.5rem] flex-1 resize-none overflow-y-auto border-0 bg-transparent p-0 py-1.5 text-sm leading-6 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:opacity-60",
  chatSend:
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent text-[var(--text-primary)] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent disabled:cursor-not-allowed disabled:opacity-40",
  aiChrome: "flex items-center justify-between gap-2 px-1",
  aiChars: "text-[11px] tabular-nums text-[var(--text-muted)]",
  manual: "space-y-3",
  composerTitle: "text-sm font-medium",
  composerDescription:
    "max-h-40 min-h-[2.75rem] w-full resize-none overflow-y-auto rounded-button border border-[var(--border)] bg-surface-card px-3 py-2 text-sm leading-6 text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 disabled:opacity-60",
  metaGrid: "grid grid-cols-2 gap-2",
  metaDueWrap: "relative",
  metaDueWide: "col-span-2",
  metaDueGhost:
    "pointer-events-none absolute inset-y-0 left-3 z-[1] flex items-center text-sm text-[var(--text-muted)]",
  metaDue: "relative w-full",
  metaDueEmpty:
    "text-transparent [&::-webkit-datetime-edit]:text-transparent [&::-webkit-calendar-picker-indicator]:opacity-60",
} as const;
