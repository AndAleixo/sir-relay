import { regenerateTelegramLinkAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export function RegenerateTelegramLinkButton({
  locale,
  label,
}: {
  locale: string;
  label: string;
}) {
  return (
    <form action={regenerateTelegramLinkAction.bind(null, locale)}>
      <Button
        type="submit"
        variant="secondary"
        aria-label={label}
        title={label}
        className="shrink-0 px-3"
      >
        <RefreshIcon className="h-4 w-4" />
        <span className="sr-only">{label}</span>
      </Button>
    </form>
  );
}
