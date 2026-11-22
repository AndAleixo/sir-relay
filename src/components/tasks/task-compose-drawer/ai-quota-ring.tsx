"use client";

import { cn } from "@/lib/cn";

type AiQuotaRingProps = {
  remaining: number;
  limit: number;
  /** Accessible label, e.g. "3 of 5 AI requests left". */
  label: string;
  className?: string;
};

/** Cursor-style context ring — filled arc = remaining / limit. */
export function AiQuotaRing({
  remaining,
  limit,
  label,
  className,
}: AiQuotaRingProps) {
  const safeLimit = Math.max(limit, 1);
  const ratio = Math.min(1, Math.max(0, remaining / safeLimit));
  const size = 22;
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * ratio;
  const empty = remaining <= 0;

  return (
    <span
      className={cn("inline-flex shrink-0", className)}
      title={label}
      aria-label={label}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={safeLimit}
      aria-valuenow={remaining}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          className={cn(
            "transition-[stroke-dasharray] duration-300 ease-out",
            empty ? "stroke-[var(--severity)]" : "stroke-brand-accent",
          )}
        />
      </svg>
    </span>
  );
}
