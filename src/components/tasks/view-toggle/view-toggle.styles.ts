/**
 * Tasks toolbar chrome — one optical size for toggles, project select, New task.
 * Mobile: h-8 / text-xs. sm+: shell-aligned h-9 / text-sm.
 */
export const viewToggleStyles = {
  /** Above board card overlays (z-20) so Project Select options stay readable. */
  toolbar: "relative z-30 mb-4 flex items-center gap-2 sm:gap-3",
  toolbarText: "min-w-0 text-sm text-[var(--text-muted)]",
  /**
   * No overflow here — `overflow-x-auto` clips the Project Select panel
   * (CSS forces overflow-y to clip too when x is not visible).
   */
  toolbarStart: "flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 sm:gap-2",
  /** Toggles only may scroll on very narrow / long-locale rows. */
  toggleCluster:
    "flex min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 sm:overflow-visible [&::-webkit-scrollbar]:hidden",
  root: "inline-flex h-8 shrink-0 items-center rounded-button border border-[var(--border)] bg-surface-card p-0.5 sm:h-9",
  button:
    "rounded-[5px] px-2 py-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] sm:px-3 sm:py-1.5 sm:text-sm",
  buttonActive: "bg-[var(--surface-bg)] text-[var(--text-primary)] shadow-sm",
  /** Floor width so short acronyms (MV) do not shrink the trigger/panel. */
  projectSelect: "relative w-auto min-w-[7.25rem] shrink-0 sm:min-w-[8.5rem]",
  projectTrigger:
    "h-8 min-h-8 w-full gap-1 px-2 text-xs sm:h-9 sm:min-h-9 sm:gap-2 sm:px-3 sm:text-sm",
  projectAdd: "shrink-0 self-center whitespace-nowrap text-xs text-[var(--text-muted)]",
  newTaskWrap: "shrink-0",
  newTask: "h-8 px-2.5 text-xs sm:h-9 sm:px-4 sm:text-sm",
} as const;
