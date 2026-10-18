export const landingStyles = {
  page: "flex min-h-screen flex-col bg-surface-bg text-[var(--text-primary)]",
  header:
    "sticky top-0 z-10 border-b border-[var(--border)] bg-surface-card/95 backdrop-blur-sm",
  headerInner:
    "mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4 md:px-6 md:py-4",
  headerBrand: "shrink-0 sm:justify-self-start",
  headerLocale: "shrink-0 sm:col-start-2 sm:justify-self-center",
  logoCompact: "h-7 w-auto shrink-0 sm:hidden",
  logo: "hidden h-7 w-auto shrink-0 sm:block md:h-8",
  nav: "ml-auto flex shrink-0 flex-nowrap items-center justify-end gap-1.5 sm:col-start-3 sm:ml-0 sm:justify-self-end sm:gap-3 md:gap-4",
  headerLoginLink:
    "inline-flex min-h-9 shrink-0 items-center px-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent sm:min-h-11 sm:px-2 sm:text-sm",
  headerSignup: "px-2.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm",
  main: "flex-1",
  hero: "mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-20",
  heroGrid: "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
  eyebrow:
    "inline-flex rounded-full bg-brand-accent-soft px-3 py-1 text-xs font-medium text-brand-accent",
  heroTitle: "mt-4 text-4xl font-semibold tracking-tight text-balance md:text-5xl",
  heroSubtitle: "mt-4 max-w-prose text-lg text-[var(--text-muted)] md:text-xl",
  heroActions: "mt-8 flex flex-wrap items-center gap-x-5 gap-y-3",
  contactNote: "border-t border-[var(--border)] bg-surface-bg",
  contactNoteText:
    "mx-auto max-w-2xl px-4 py-8 text-center text-sm leading-relaxed text-[var(--text-muted)] md:px-6 md:py-10",
  contactNoteLink:
    "font-medium text-[var(--text-primary)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  editor: "border-t border-[var(--border)] bg-surface-bg",
  editorInner:
    "mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:px-6 md:py-20 lg:grid-cols-2 lg:gap-16",
  editorCopy: "max-w-prose",
  editorTitle: "text-2xl font-semibold text-balance md:text-3xl",
  editorLead: "mt-4 text-lg text-[var(--text-muted)]",
  editorPoint: "mt-3 text-sm leading-relaxed text-[var(--text-muted)]",
  features: "border-t border-[var(--border)] bg-surface-card",
  featuresInner: "mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20",
  featuresTitle: "text-center text-2xl font-semibold md:text-3xl",
  featuresLead: "mx-auto mt-3 max-w-2xl text-center text-[var(--text-muted)]",
  featureGrid: "mt-12 grid gap-8 md:grid-cols-3 md:gap-10",
  featureCard: "border-t border-[var(--border)] pt-6",
  featureTitle: "text-lg font-semibold",
  featureBody: "mt-2 text-sm leading-relaxed text-[var(--text-muted)]",
  faq: "border-t border-[var(--border)] bg-surface-bg",
  faqInner: "mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20",
  faqTitle: "text-center text-2xl font-semibold md:text-3xl",
  faqList: "mx-auto mt-10 max-w-2xl divide-y divide-[var(--border)] border-y border-[var(--border)]",
  faqItem: "group py-1",
  faqQuestion:
    "flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left text-base font-semibold text-[var(--text-primary)] marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent [&::-webkit-details-marker]:hidden after:shrink-0 after:text-[var(--text-muted)] after:content-['+'] group-open:after:content-['–']",
  faqAnswer: "pb-4 pr-8 text-sm leading-relaxed text-[var(--text-muted)]",
  footer: "border-t border-[var(--border)] bg-surface-card",
  footerInner:
    "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6",
  footerLinks: "flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--text-muted)]",
  footerLink:
    "inline-flex min-h-11 items-center hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  footerCopy: "text-sm text-[var(--text-muted)]",
  editorFrame:
    "overflow-hidden rounded-card border border-[#3c3c3c] bg-[#1e1e1e] text-[#cccccc] shadow-md shadow-black/25 selection:bg-[#eab308] selection:text-[#0a0a0a]",
  editorBar: "flex items-center gap-2 border-b border-[#3c3c3c] px-4 py-3",
  editorDot: "h-2.5 w-2.5 rounded-full bg-[#3c3c3c]",
  editorLabel: "ml-2 text-xs font-medium",
  editorBody: "space-y-4 p-4",
  editorSection:
    "text-[11px] font-semibold uppercase tracking-[0.04em] text-[#9d9d9d]",
  editorCard: "mt-2 rounded-md border border-[#3c3c3c] bg-[#252526] px-3 py-2 text-sm",
  editorAcronym: "font-semibold text-[#eab308]",
  editorDue: "mt-1 text-[11px] font-semibold text-[#f48771]",
} as const;

export const demoStyles = {
  wrap: "w-full",
  frame:
    "overflow-hidden rounded-card border border-[var(--border)] bg-surface-card shadow-md shadow-black/5",
  chrome:
    "flex items-center gap-2 border-b border-[var(--border)] bg-surface-bg px-4 py-3",
  dot: "h-2.5 w-2.5 rounded-full bg-[var(--border)]",
  url: "ml-2 flex-1 truncate rounded-md bg-surface-card px-3 py-1 text-xs text-[var(--text-muted)]",
  video: "block w-full bg-surface-bg",
  body: "grid grid-cols-3 gap-3 p-4 md:gap-4 md:p-6",
  column: "rounded-card border border-[var(--border)] bg-surface-bg p-2 md:p-3",
  columnMuted: "opacity-45",
  columnFocus: "ring-1 ring-brand-accent/30",
  columnTitle: "mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] md:text-xs",
  card:
    "rounded-button border border-[var(--border)] bg-surface-card px-2 py-2 text-xs shadow-sm md:px-3 md:py-2.5 md:text-sm",
  cardActive: "border-brand-accent/40 bg-brand-accent-soft",
  videoWrap: "relative",
  videoToggle:
    "absolute bottom-3 right-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-button border border-[var(--border)] bg-surface-card/95 px-3 text-xs font-medium text-[var(--text-primary)] shadow-sm backdrop-blur-sm hover:bg-surface-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  caption: "mt-3 text-center text-sm text-[var(--text-muted)]",
} as const;
