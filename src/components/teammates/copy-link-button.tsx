"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type CopyLinkButtonProps = {
  text: string;
  label: string;
  copiedLabel: string;
  showLabel?: boolean;
  className?: string;
};

function ClipboardIcon({ className }: { className?: string }) {
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
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function CopyLinkButton({
  text,
  label,
  copiedLabel,
  showLabel = false,
  className,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied */
    }
  }

  const actionLabel = copied ? copiedLabel : label;

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleCopy}
      disabled={!text}
      aria-label={actionLabel}
      title={actionLabel}
      className={cn("shrink-0 px-3", className)}
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 text-[var(--success)]" />
      ) : (
        <ClipboardIcon className="h-4 w-4" />
      )}
      <span className={showLabel ? undefined : "sr-only"}>{actionLabel}</span>
    </Button>
  );
}
