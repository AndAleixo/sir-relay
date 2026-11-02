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
    "mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 md:px-6 md:py-20",
  editorCopy: "mx-auto max-w-2xl text-center",
  editorTitle: "text-2xl font-semibold text-balance md:text-3xl",
  editorLead: "mt-4 text-lg text-[var(--text-muted)]",
  editorPoint: "mt-3 text-sm leading-relaxed text-[var(--text-muted)]",
  editorPreviews: "grid items-stretch gap-8 lg:grid-cols-2 lg:gap-6",
  editorFigure: "flex min-w-0 flex-col",
  editorPreviewGrow: "flex min-h-0 flex-1 flex-col [&>*]:h-full",
  editorCaption:
    "mb-3 shrink-0 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]",
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
  /** Mini IDE chrome for the landing editor section (decorative). */
  ideShell:
    "flex h-full min-h-[22rem] flex-col overflow-hidden rounded-card border border-[#2b2b2b] bg-[#1e1e1e] text-[#cccccc] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] selection:bg-[#eab308] selection:text-[#0a0a0a]",
  ideTitlebar:
    "flex shrink-0 items-center gap-3 border-b border-[#2b2b2b] bg-[#323233] px-3 py-2",
  ideTraffic: "flex items-center gap-1.5",
  ideDot: "h-2.5 w-2.5 rounded-full",
  ideDotClose: "bg-[#ff5f57]",
  ideDotMin: "bg-[#febc2e]",
  ideDotMax: "bg-[#28c840]",
  ideTitlebarLabel:
    "min-w-0 flex-1 truncate text-center text-[11px] font-medium tracking-wide text-[#bbbbbb]",
  ideWorkspace:
    "grid min-h-0 flex-1 grid-cols-[28px_minmax(0,1fr)] sm:grid-cols-[36px_minmax(11rem,1.05fr)_minmax(0,1fr)]",
  ideWorkspaceCompact:
    "grid min-h-0 flex-1 grid-cols-[28px_minmax(0,1fr)] sm:grid-cols-[36px_minmax(0,1fr)]",
  ideActivity:
    "flex flex-col items-center gap-3 border-r border-[#2b2b2b] bg-[#333333] py-3",
  ideActivityIcon: "h-3.5 w-3.5 rounded-[3px] bg-[#858585]/55",
  ideActivityIconActive:
    "relative bg-[#cccccc] before:absolute before:-left-[9px] before:top-1/2 before:h-3.5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-brand-accent sm:before:-left-[11px]",
  ideSidebar: "flex min-h-0 min-w-0 flex-1 flex-col bg-[#252526]",
  ideSidebarWithEditor:
    "flex min-h-0 min-w-0 flex-col border-r border-[#2b2b2b] bg-[#252526]",
  ideSidebarHead: "shrink-0 border-b border-[#2b2b2b] px-3 py-2.5",
  ideSidebarTitle:
    "text-[10px] font-semibold uppercase tracking-[0.08em] text-[#bbbbbb]",
  ideSidebarHint: "mt-0.5 text-[11px] text-[#858585]",
  ideSidebarBody: "flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-2.5 sm:p-3",
  ideBoardTop: "flex shrink-0 flex-col gap-2",
  ideGroupPick: "grid gap-1",
  ideFieldLabel:
    "text-[10px] font-semibold uppercase tracking-[0.04em] text-[#9d9d9d]",
  ideSelect:
    "block w-full truncate rounded border border-[#3c3c3c] bg-[#3c3c3c]/40 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#cccccc]",
  ideSelectGrow:
    "block min-w-0 flex-1 truncate rounded border border-[#3c3c3c] bg-[#3c3c3c]/40 px-2 py-1 text-[11px] text-[#cccccc]",
  ideToolbar: "flex items-center gap-2",
  ideAdd: "shrink-0 text-[11px] font-medium text-[#eab308]",
  ideSection: "min-w-0",
  ideSectionTitle:
    "mb-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#9d9d9d]",
  ideCard:
    "mb-1.5 flex gap-1.5 rounded-md border border-[#3c3c3c] bg-[#1e1e1e] p-1.5 last:mb-0",
  ideCardActive: "border-brand-accent/35 bg-[#2a2a1a]",
  ideHandle: "w-1.5 shrink-0 self-stretch rounded-[2px]",
  ideHandleEasy: "bg-[#d1fae5]",
  ideHandleMedium: "bg-[#fef3c7]",
  ideHandleHard: "bg-[#fee2e2]",
  ideCardBody: "min-w-0 flex-1",
  ideCardTitle: "text-[11px] leading-snug text-[#cccccc] sm:text-xs",
  ideAcronym: "font-semibold text-[#eab308]",
  ideAcronymSep: "mx-0.5 font-semibold text-[#eab308]",
  ideDue: "mt-0.5 text-[10px] font-semibold text-[#f48771]",
  ideEditor: "hidden min-w-0 bg-[#1e1e1e] sm:block",
  ideTabRow: "border-b border-[#2b2b2b] bg-[#2d2d2d] px-2 pt-1.5",
  ideTab:
    "inline-flex rounded-t-md border border-b-0 border-[#2b2b2b] bg-[#1e1e1e] px-2.5 py-1 text-[10px] text-[#cccccc]",
  ideCode: "overflow-hidden p-3 font-mono text-[10px] leading-5 text-[#9cdcfe] sm:text-[11px]",
  ideCodeLine: "flex gap-3 whitespace-pre",
  ideCodeLineDim: "text-[#6a9955]",
  ideCodeGutter: "w-4 shrink-0 select-none text-right text-[#858585]",
  ideCodeKw: "text-[#569cd6]",
  mcpShell:
    "flex h-full min-h-[22rem] flex-col overflow-hidden rounded-card border border-[#2b2b2b] bg-[#1e1e1e] text-[#cccccc] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] selection:bg-[#eab308] selection:text-[#0a0a0a]",
  mcpBody: "flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-4",
  mcpUser:
    "self-end max-w-[92%] rounded-md bg-[#2f2f2f] px-3 py-2 text-[12px] leading-snug text-[#e4e4e4]",
  mcpAssistant:
    "max-w-[95%] rounded-md border border-[#3c3c3c] bg-[#252526] px-3 py-2 text-[12px] leading-snug text-[#d4d4d4]",
  mcpTool:
    "rounded-md border border-[#3c3c3c] bg-[#181818] px-3 py-2",
  mcpToolName:
    "flex flex-wrap items-center gap-2 font-mono text-[11px] font-medium text-[#eab308]",
  mcpToolBadge:
    "rounded-[3px] bg-brand-accent/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#eab308]",
  mcpToolResult: "mt-2 space-y-1 text-[11px] leading-snug text-[#cccccc]",
  mcpToolArgs: "mt-1.5 font-mono text-[10px] text-[#9d9d9d]",
  mcpArgValue: "text-[#9cdcfe]",
  mcpStatus: "text-[#858585]",
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
