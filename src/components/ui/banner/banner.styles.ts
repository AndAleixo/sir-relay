export type BannerVariant = "warning" | "severity" | "info";

export const bannerStyles = {
  base: "rounded-card border px-4 py-3 text-sm",
  variants: {
    warning:
      "border-brand-accent/40 bg-brand-accent-soft text-[var(--text-primary)]",
    severity:
      "border-[var(--severity-soft-hover)] bg-[var(--severity-soft)] text-[var(--severity)]",
    info: "border-[var(--border)] bg-surface-card text-[var(--text-primary)]",
  },
} as const;
