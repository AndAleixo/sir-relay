import { cn } from "@/lib/cn";

/** Minimal mark for invited / deactivated account. */
export function AccountInactiveIcon({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-[var(--text-muted)]",
        className,
      )}
      title={label}
      aria-label={label}
      role="img"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
        <path d="M3 3l18 18" />
      </svg>
    </span>
  );
}
