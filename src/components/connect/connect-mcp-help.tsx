"use client";

import { useTranslations } from "next-intl";

/** Collapsed MCP how-to — short steps only. */
export function ConnectMcpHelp({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: (open: boolean) => void;
}) {
  const t = useTranslations("profile");

  return (
    <details
      id="mcp-setup-help"
      className="border-t border-[var(--border)] pt-4"
      open={open}
      onToggle={(e) => onToggle((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer list-none text-sm font-medium text-[var(--text-primary)] marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          {t("linkKeyMcpHelpTitle")}
          <span className="text-[var(--text-muted)]" aria-hidden>
            {open ? "–" : "+"}
          </span>
        </span>
      </summary>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--text-primary)]">
        <li>
          {t("linkKeyMcpStepNode")}{" "}
          <a
            href="https://nodejs.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-accent hover:text-brand-accent-hover"
          >
            nodejs.org
          </a>
          .
        </li>
        <li>{t("linkKeyMcpStepKey")}</li>
        <li>{t("linkKeyMcpStepJson")}</li>
        <li>{t("linkKeyMcpStepRestart")}</li>
      </ol>
    </details>
  );
}
