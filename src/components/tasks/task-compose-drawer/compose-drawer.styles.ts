import { popoverStyles } from "@/components/ui/popover";

/** Compose drawer — flush under `--app-chrome-height`; Family A open/close motion. */
export const composeDrawerStyles = {
  root: "fixed inset-x-0 bottom-0 top-[var(--app-chrome-height,3.5rem)] z-[45] flex justify-end",
  backdrop: "absolute inset-0 bg-[var(--text-primary)]/15 transition-opacity",
  backdropMotionOpen: popoverStyles.panelMotionOpen,
  backdropMotionClose: popoverStyles.panelMotionClose,
  backdropOpen: "opacity-100",
  backdropClosed: "pointer-events-none opacity-0",
  panel: [
    "relative flex h-full w-full max-w-lg origin-top flex-col overflow-hidden",
    "border-l border-[var(--border)] bg-surface-card",
    "shadow-[-16px_0_48px_-16px_rgba(0,0,0,0.2)]",
    "transition-[opacity,transform]",
  ].join(" "),
  panelMotionOpen: popoverStyles.panelMotionOpen,
  panelMotionClose: popoverStyles.panelMotionClose,
  panelOpen: popoverStyles.panelOpen,
  panelClosed: popoverStyles.panelClosed,
  header:
    "flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-surface-card px-4 py-3.5",
  title: "text-base font-semibold tracking-tight text-[var(--text-primary)]",
  closeBtn:
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  body: "flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4",
  footer:
    "flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--border)] bg-surface-card px-4 py-3",
  chat:
    "flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-bg)]/70 p-2 pl-3 focus-within:border-brand-accent/50 focus-within:ring-2 focus-within:ring-brand-accent/15",
  chatInput:
    "max-h-40 min-h-[1.5rem] flex-1 resize-none overflow-y-auto border-0 bg-transparent p-0 py-1.5 text-sm leading-6 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:opacity-60",
  chatSend:
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent text-[var(--text-primary)] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent disabled:cursor-not-allowed disabled:opacity-40",
  manual: "space-y-3",
  composerTitle: "text-sm font-medium",
  composerDescription:
    "max-h-40 min-h-[2.75rem] w-full resize-none overflow-y-auto rounded-button border border-[var(--border)] bg-surface-card px-3 py-2 text-sm leading-6 text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 disabled:opacity-60",
  metaGrid: "grid grid-cols-2 gap-2",
  metaDueWrap: "relative col-span-2",
  metaDueGhost:
    "pointer-events-none absolute inset-y-0 left-3 z-[1] flex items-center text-sm text-[var(--text-muted)]",
  metaDue: "relative w-full",
  metaDueEmpty:
    "text-transparent [&::-webkit-datetime-edit]:text-transparent [&::-webkit-calendar-picker-indicator]:opacity-60",
} as const;
