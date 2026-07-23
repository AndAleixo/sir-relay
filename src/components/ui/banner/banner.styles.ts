export type BannerVariant = "warning" | "danger" | "info";

export const bannerStyles = {
  base: "rounded-card border px-4 py-3 text-sm",
  variants: {
    warning:
      "border-brand-accent/40 bg-brand-accent-soft text-[var(--text-primary)]",
    danger: "border-red-200 bg-red-50 text-red-800",
    info: "border-[var(--border)] bg-surface-card text-[var(--text-primary)]",
  },
} as const;
