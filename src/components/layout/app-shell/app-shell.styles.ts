export const shellStyles = {
  root: "flex min-h-screen flex-col bg-surface-bg md:flex-row",
  sidebarShell:
    "relative hidden shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:block",
  sidebarExpanded: "w-56",
  sidebarCollapsed: "w-20",
  sidebar:
    "flex h-full min-h-screen w-full flex-col overflow-hidden border-r border-[var(--border)] bg-surface-card",
  logoLink:
    "relative flex shrink-0 items-center justify-center border-b border-[var(--border)] px-3 py-6 transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
  logoLinkCollapsed: "px-2",
  logoWrap:
    "relative mx-auto h-10 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
  logoWrapExtended: "w-[8.75rem]",
  logoWrapCompact: "w-16",
  logoImage:
    "absolute left-1/2 top-1/2 h-10 max-w-none -translate-x-1/2 -translate-y-1/2 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
  logoExtended: "w-[8.75rem]",
  logoCompact: "w-16",
  logoVisible: "scale-100 opacity-100",
  logoHidden: "pointer-events-none scale-95 opacity-0",
  collapseToggle:
    "absolute left-full top-[5.75rem] z-30 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-surface-card text-[var(--text-muted)] shadow-md transition-colors hover:border-brand-accent/40 hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  collapseChevron:
    "h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
  collapseChevronRotated: "rotate-180",
  nav: "flex flex-1 flex-col gap-1 p-2 transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
  navCollapsed: "px-1.5",
  navLink:
    "flex items-center gap-3 rounded-button px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-[background-color,padding,gap,color] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[var(--surface-bg)]",
  navLinkActive:
    "bg-brand-accent-soft text-brand-accent hover:bg-brand-accent-soft hover:text-brand-accent",
  navLinkCollapsed: "justify-center gap-0 px-0 py-2.5",
  navLabel:
    "truncate whitespace-nowrap transition-[opacity,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
  navLabelCollapsed: "w-0 opacity-0",
  sidebarFooter:
    "mt-auto shrink-0 border-t border-[var(--border)] p-3 transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
  sidebarFooterCollapsed: "px-2 py-3",
  sidebarProfileLink:
    "flex min-w-0 items-center gap-3 rounded-button px-2 py-2 transition-colors hover:bg-[var(--surface-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  sidebarProfileLinkCollapsed: "justify-center gap-0 px-0 py-0.5",
  userBlock:
    "min-w-0 flex-1 overflow-hidden transition-[opacity,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
  userBlockCollapsed: "w-0 flex-none opacity-0",
  userName: "truncate text-sm font-medium text-[var(--text-primary)]",
  userRole: "text-xs text-[var(--text-muted)]",
  main: "flex min-w-0 flex-1 flex-col",
  mobileHeader:
    "sticky top-0 z-40 shrink-0 overflow-visible border-b border-[var(--border)] bg-surface-card md:hidden",
  mobileHeaderTop: "flex h-14 items-center justify-between gap-3 overflow-visible px-4",
  mobileLogoLink: "flex shrink-0 items-center",
  mobileLogo: "h-9 w-auto",
  mobileHeaderActions: "relative flex items-center gap-2 overflow-visible",
  mobileUserLink: "shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  mobileNav: "flex items-stretch justify-around gap-1 border-t border-[var(--border)] px-2 py-1.5",
  mobileNavLink:
    "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-button px-2 py-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)]",
  mobileNavLinkActive:
    "bg-brand-accent-soft text-brand-accent hover:bg-brand-accent-soft hover:text-brand-accent",
  mobileNavLabel: "max-w-full truncate text-[10px] font-medium leading-tight",
  header:
    "hidden h-14 items-center justify-between gap-4 overflow-visible border-b border-[var(--border)] bg-surface-card px-6 md:flex",
  headerGroup: "relative min-w-0 flex-1 overflow-visible",
  headerActions: "flex items-center gap-1",
  headerAvatarLink:
    "rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  localeSelect:
    "rounded-button border border-[var(--border)] bg-surface-card px-3 py-1.5 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  localeSelectCompact:
    "rounded-button border border-[var(--border)] bg-surface-card px-2 py-1 text-xs font-medium uppercase text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  userMenuRoot: "relative",
  userMenuTrigger:
    "flex h-9 w-7 items-center justify-center rounded-button text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  userMenuPanel:
    "absolute right-0 top-full z-50 mt-1 min-w-[12rem] overflow-hidden rounded-button border border-[var(--border)] bg-surface-card py-1 shadow-lg",
  userMenuHeader: "border-b border-[var(--border)] px-3 py-2",
  userMenuName: "truncate text-sm font-medium text-[var(--text-primary)]",
  userMenuRole: "text-xs text-[var(--text-muted)]",
  userMenuItem:
    "block w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-bg)]",
  userMenuForm: "border-t border-[var(--border)]",
  userMenuLogout: "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
  groupSwitcherRoot: "relative min-w-0",
  groupSwitcherCompact: "shrink-0",
  groupSwitcherTrigger:
    "flex w-full min-w-0 items-center gap-2 rounded-button border border-[var(--border)] bg-[var(--surface-bg)] px-2.5 py-2 text-left transition-colors hover:border-brand-accent/30 hover:bg-surface-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
  groupSwitcherTriggerProminent:
    "max-w-md border-transparent bg-transparent px-0 py-0 hover:border-transparent hover:bg-transparent",
  groupSwitcherTriggerCompact:
    "max-w-[9rem] gap-1 rounded-button border border-[var(--border)] bg-surface-card px-2 py-1.5 text-sm",
  groupSwitcherText: "min-w-0 flex-1 overflow-hidden",
  groupSwitcherName: "block truncate text-base font-semibold text-[var(--text-primary)]",
  groupSwitcherNameCompact: "truncate text-sm font-medium text-[var(--text-primary)]",
  groupSwitcherRole: "block truncate text-xs text-[var(--text-muted)]",
  groupSwitcherPanel:
    "absolute left-0 top-full z-[100] mt-1 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-button border border-[var(--border)] bg-surface-card shadow-lg",
  groupSwitcherPanelMobile:
    "fixed z-[200] max-h-[min(calc(100vh-5rem),32rem)] overflow-hidden rounded-button border border-[var(--border)] bg-surface-card shadow-lg",
  groupSwitcherBackdrop: "fixed inset-0 z-[199] bg-black/25",
  groupPanelBody: "max-h-[inherit] overflow-y-auto overscroll-contain",
  groupPanelEmpty: "px-3 py-2 text-sm text-[var(--text-muted)]",
  groupPanelError:
    "mx-3 mt-2 rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700",
  groupPanelSection: "border-t border-[var(--border)] px-3 py-3",
  groupPanelLabel: "text-sm font-medium text-[var(--text-primary)]",
  groupPanelHint: "mt-1 text-xs text-[var(--text-muted)]",
  groupPanelAction:
    "flex min-h-11 w-full touch-manipulation items-center rounded-button px-2 text-left text-sm font-medium text-brand-accent transition-colors hover:bg-[var(--surface-bg)] active:bg-[var(--surface-bg)]",
  groupPanelForm: "space-y-3",
  groupPanelActions: "flex gap-2",
  groupPanelJoinRow: "flex gap-2",
  groupPanelDangerAction:
    "flex min-h-11 w-full touch-manipulation items-center rounded-button px-2 text-left text-sm font-medium text-[var(--danger)] transition-colors hover:bg-red-50 active:bg-red-50",
  groupSwitcherItem:
    "flex min-h-11 w-full touch-manipulation items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-bg)] active:bg-[var(--surface-bg)]",
  groupSwitcherItemActive: "bg-brand-accent-soft text-brand-accent",
  groupSwitcherItemRole: "shrink-0 text-xs text-[var(--text-muted)]",
  content: "flex-1 p-4 md:p-6",
  contentWide: "max-w-[100vw] overflow-x-hidden",
  pageHeader: "mb-6 flex flex-wrap items-center justify-between gap-4",
  pageHeaderActionOnly: "mb-4 flex justify-end",
  pageTitle: "text-2xl font-semibold tracking-tight text-[var(--text-primary)]",
} as const;
