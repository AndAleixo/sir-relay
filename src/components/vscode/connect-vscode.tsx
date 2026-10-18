"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { connectVsCode } from "@/app/actions/vscode";
import { CopyLinkButton } from "@/components/teammates/copy-link-button";
import { Button } from "@/components/ui/button";

export function ConnectVsCode({ scheme }: { scheme: string }) {
  const t = useTranslations("landing.editor");
  const [pending, setPending] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function link() {
    setPending(true);
    setError(null);
    const result = await connectVsCode(scheme);
    setPending(false);
    if ("error" in result) {
      setError(t("expired"));
      return;
    }
    setToken(result.token);
    setUri(result.uri);
  }

  if (token && uri) {
    return (
      <div className="space-y-3 text-sm">
        <p>{t("linked")}</p>
        <a href={uri} className="inline-block font-medium text-[var(--brand-accent-hover)]">
          {t("openEditor")}
        </a>
        <div className="flex flex-wrap items-start gap-2">
          <p className="min-w-0 flex-1 break-all rounded-md border border-[var(--border)] bg-[var(--surface-bg)] p-2 font-mono text-xs">
            {token}
          </p>
          <CopyLinkButton
            showLabel
            text={token}
            label={t("copyCode")}
            copiedLabel={t("copied")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-[var(--severity)]">{error}</p> : null}
      <Button type="button" disabled={pending} onClick={() => void link()}>
        {pending ? t("linking") : t("link")}
      </Button>
    </div>
  );
}
