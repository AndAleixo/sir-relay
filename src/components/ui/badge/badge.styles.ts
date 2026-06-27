export const badgeBase =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

export const statusBadgeVariants = {
  todo: "bg-[var(--surface-bg)] text-[var(--gray-strong)] ring-1 ring-[var(--border)]",
  doing: "bg-brand-accent-soft text-[var(--text-primary)] ring-1 ring-brand-accent/30",
  done: "bg-[var(--surface-bg)] text-[var(--status-done)] ring-1 ring-[var(--border)]",
} as const;

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "accent";

export const toneBadgeVariants = {
  neutral: "bg-[var(--surface-bg)] text-[var(--text-muted)] ring-1 ring-[var(--border)]",
  success: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  warning: "bg-brand-accent-soft text-[var(--text-primary)] ring-1 ring-brand-accent/40",
  danger: "bg-red-50 text-red-700 ring-1 ring-red-200",
  accent: "bg-brand-accent text-[var(--text-primary)]",
} as const;
