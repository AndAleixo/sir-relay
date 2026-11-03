"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CopyLinkButton } from "@/components/teammates/copy-link-button";
import { ButtonLink } from "@/components/ui/button";
import { buildMcpConfigJson } from "@/lib/mcp-config-json";

export type ConnectTakeaway = "ide" | "mcp";

const segment = {
  group:
    "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-bg)] p-0.5 shadow-sm",
  item: "rounded-full px-3 py-1.5 text-center text-xs font-medium tracking-wide text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent sm:min-w-[4.5rem]",
  itemActive:
    "rounded-full bg-surface-card px-3 py-1.5 text-center text-xs font-semibold tracking-wide text-[var(--text-primary)] shadow-sm ring-1 ring-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent sm:min-w-[4.5rem]",
} as const;

function editorDeepLink(scheme: string, token: string): string {
  return `${scheme}://sirrelay.sirrelay/connect?token=${encodeURIComponent(token)}`;
}

export function ConnectKeyReveal({
  scheme,
  appUrl,
  token,
  onOpenHelp,
}: {
  scheme: string;
  appUrl: string;
  token: string;
  onOpenHelp: () => void;
}) {
  const t = useTranslations("profile");
  const [takeaway, setTakeaway] = useState<ConnectTakeaway>("ide");
  const [origin, setOrigin] = useState(appUrl);
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const deepLink = useMemo(
    () => editorDeepLink(scheme, token),
    [scheme, token],
  );
  const json = useMemo(
    () => buildMcpConfigJson(origin, token),
    [origin, token],
  );
  const isIde = takeaway === "ide";
  const copyText = isIde ? token : json;

  return (
    <div className="space-y-3 rounded-card border border-[var(--border)] bg-[var(--brand-accent-soft)]/40 p-4">
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-[var(--text-muted)]">{t("linkKeyShownOnce")}</p>
        <div
          className={segment.group}
          role="tablist"
          aria-label={t("linkKeyTakeawayLabel")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={isIde}
            className={isIde ? segment.itemActive : segment.item}
            onClick={() => setTakeaway("ide")}
          >
            {t("linkKeyTakeawayIde")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isIde}
            className={!isIde ? segment.itemActive : segment.item}
            onClick={() => setTakeaway("mcp")}
          >
            {t("linkKeyTakeawayMcp")}
          </button>
        </div>
      </div>

      <div role="tabpanel" className="space-y-2">
        <div className="flex min-h-8 items-center justify-between gap-3">
          <p className="text-xs font-medium text-[var(--text-primary)]">
            {isIde ? t("linkKeyFieldKey") : t("linkKeyFieldMcp")}
          </p>
          {isIde ? (
            <ButtonLink
              href={deepLink}
              className="h-8 min-h-8 shrink-0 px-3 py-0 text-xs"
            >
              {t("linkKeyOpenIde")}
            </ButtonLink>
          ) : (
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-brand-accent hover:text-brand-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
              onClick={onOpenHelp}
            >
              {t("linkKeyMcpNeedSteps")}
            </button>
          )}
        </div>

        {isIde ? (
          <div className="flex overflow-hidden rounded-button border border-[var(--border)] bg-[var(--surface-card)]">
            <p className="min-w-0 flex-1 truncate px-3 py-2 font-mono text-xs leading-8 text-[var(--text-primary)]">
              {token}
            </p>
            <div className="flex shrink-0 items-center border-l border-[var(--border)] p-1">
              <CopyLinkButton
                text={copyText}
                label={t("linkKeyCopy")}
                copiedLabel={t("linkKeyCopied")}
                className="h-8 w-8 px-0 sm:h-8 sm:px-0"
              />
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-button border border-[var(--border)] bg-[var(--surface-card)]">
            <pre className="max-h-36 overflow-auto px-3 py-2.5 pr-12 pb-11 font-mono text-[11px] leading-relaxed text-[var(--text-primary)]">
              <code>{json}</code>
            </pre>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--surface-card)] to-transparent" />
            <div className="absolute bottom-2 right-2">
              <CopyLinkButton
                text={copyText}
                label={t("linkKeyCopy")}
                copiedLabel={t("linkKeyCopied")}
                className="h-8 w-8 px-0 shadow-sm sm:h-8 sm:px-0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
