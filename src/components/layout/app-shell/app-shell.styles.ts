export const shellStyles = {
  root: "flex min-h-screen bg-surface-bg",
  sidebar:
    "hidden w-56 shrink-0 flex-col border-r border-[var(--border)] bg-surface-card md:flex",
  logoLink: "flex items-center justify-center border-b border-[var(--border)] px-4 py-5",
  nav: "flex flex-1 flex-col gap-1 p-3",
  navLink:
    "rounded-button px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-bg)]",
  sidebarFooter: "border-t border-[var(--border)] p-4",
  userName: "truncate text-sm font-medium text-[var(--text-primary)]",
  userRole: "text-xs text-[var(--text-muted)]",
  main: "flex min-w-0 flex-1 flex-col",
  header:
    "flex h-14 items-center justify-end gap-4 border-b border-[var(--border)] bg-surface-card px-4 md:px-6",
  headerSpacer: "flex-1 md:hidden",
  headerUser: "text-sm font-medium text-[var(--text-primary)] hover:text-brand-accent-hover",
  content: "flex-1 p-4 md:p-6",
  contentWide: "max-w-[100vw] overflow-x-hidden",
  pageHeader: "mb-6 flex flex-wrap items-center justify-between gap-4",
  pageTitle: "text-2xl font-semibold tracking-tight text-[var(--text-primary)]",
  mockBanner:
    "border-b border-brand-accent/30 bg-brand-accent-soft px-4 py-2 text-center text-xs font-medium text-[var(--text-primary)]",
} as const;
