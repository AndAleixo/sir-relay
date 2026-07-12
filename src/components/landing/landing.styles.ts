export const landingStyles = {
  page: "flex min-h-screen flex-col bg-surface-bg text-[var(--text-primary)]",
  header:
    "sticky top-0 z-10 border-b border-[var(--border)] bg-surface-card/95 backdrop-blur-sm",
  headerInner:
    "mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6",
  logo: "h-8 w-auto",
  nav: "flex items-center gap-3 md:gap-4",
  localeNav: "shrink-0",
  localeSegmentGroup:
    "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-bg)] p-0.5 shadow-sm",
  localeSegment:
    "min-w-[2.75rem] rounded-full px-3 py-1.5 text-center text-xs font-medium tracking-wide text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  localeSegmentActive:
    "min-w-[2.75rem] rounded-full bg-surface-card px-3 py-1.5 text-center text-xs font-semibold tracking-wide text-[var(--text-primary)] shadow-sm ring-1 ring-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  main: "flex-1",
  hero: "mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-20",
  heroGrid: "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
  eyebrow:
    "inline-flex rounded-full bg-brand-accent-soft px-3 py-1 text-xs font-medium text-brand-accent",
  heroTitle: "mt-4 text-4xl font-semibold tracking-tight md:text-5xl",
  heroSubtitle: "mt-4 text-lg text-[var(--text-muted)] md:text-xl",
  heroActions: "mt-8 flex flex-wrap gap-3",
  features: "border-t border-[var(--border)] bg-surface-card",
  featuresInner: "mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20",
  featuresTitle: "text-center text-2xl font-semibold md:text-3xl",
  featuresLead: "mx-auto mt-3 max-w-2xl text-center text-[var(--text-muted)]",
  featureGrid: "mt-12 grid gap-6 md:grid-cols-3",
  featureCard:
    "rounded-card border border-[var(--border)] bg-surface-bg p-6 shadow-sm",
  featureTitle: "text-lg font-semibold",
  featureBody: "mt-2 text-sm leading-relaxed text-[var(--text-muted)]",
  footer: "border-t border-[var(--border)] bg-surface-card",
  footerInner:
    "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6",
  footerLinks: "flex flex-wrap gap-4 text-sm text-[var(--text-muted)]",
  footerLink: "hover:text-[var(--text-primary)]",
  footerCopy: "text-sm text-[var(--text-muted)]",
} as const;

export const demoStyles = {
  wrap: "w-full",
  frame:
    "overflow-hidden rounded-card border border-[var(--border)] bg-surface-card shadow-lg",
  chrome:
    "flex items-center gap-2 border-b border-[var(--border)] bg-surface-bg px-4 py-3",
  dot: "h-2.5 w-2.5 rounded-full bg-[var(--border)]",
  url: "ml-2 flex-1 truncate rounded-md bg-surface-card px-3 py-1 text-xs text-[var(--text-muted)]",
  video: "block w-full bg-surface-bg",
  body: "grid grid-cols-3 gap-3 p-4 md:gap-4 md:p-6",
  column: "rounded-card border border-[var(--border)] bg-surface-bg p-2 md:p-3",
  columnTitle: "mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] md:text-xs",
  card:
    "rounded-button border border-[var(--border)] bg-surface-card px-2 py-2 text-xs shadow-sm md:px-3 md:py-2.5 md:text-sm",
  cardActive: "border-brand-accent/40 bg-brand-accent-soft",
  caption: "mt-3 text-center text-xs text-[var(--text-muted)]",
} as const;
