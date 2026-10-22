"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  createLinkTokenAction,
  revokeLinkTokenAction,
} from "@/app/actions/connect";
import { CopyLinkButton } from "@/components/teammates/copy-link-button";
import { Banner } from "@/components/ui/banner";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export function LinkTokenCard({
  locale,
  initiallyHasKey,
}: {
  locale: string;
  initiallyHasKey: boolean;
}) {
  const t = useTranslations("profile");
  const [hasKey, setHasKey] = useState(initiallyHasKey);
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createOrRotate() {
    setPending(true);
    setError(null);
    const result = await createLinkTokenAction();
    setPending(false);
    if ("error" in result) {
      setError(t("linkKeyUnauthorized"));
      return;
    }
    setToken(result.token);
    setHasKey(true);
  }

  async function revoke() {
    setPending(true);
    setError(null);
    const result = await revokeLinkTokenAction();
    setPending(false);
    if ("error" in result) {
      setError(t("linkKeyUnauthorized"));
      return;
    }
    setToken(null);
    setHasKey(false);
  }

  return (
    <Card className="min-w-0 md:col-span-2">
      <CardHeader>
        <h2 className="text-sm font-semibold">{t("linkKeySection")}</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{t("linkKeyHint")}</p>
      </CardHeader>
      <CardBody className="space-y-3">
        {error ? <Banner variant="severity">{error}</Banner> : null}

        {token ? (
          <div className="space-y-2">
            <Banner variant="info">{t("linkKeyShownOnce")}</Banner>
            <div className="flex flex-wrap items-start gap-2">
              <p className="min-w-0 flex-1 break-all rounded-md border border-[var(--border)] bg-[var(--surface-bg)] p-2 font-mono text-xs">
                {token}
              </p>
              <CopyLinkButton
                showLabel
                text={token}
                label={t("linkKeyCopy")}
                copiedLabel={t("linkKeyCopied")}
              />
            </div>
          </div>
        ) : hasKey ? (
          <p className="text-sm text-[var(--text-muted)]">{t("linkKeyActive")}</p>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">{t("linkKeyNone")}</p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            disabled={pending}
            onClick={() => void createOrRotate()}
            className="w-full sm:w-auto"
          >
            {pending
              ? t("linkKeyWorking")
              : hasKey
                ? t("linkKeyRotate")
                : t("linkKeyCreate")}
          </Button>
          {hasKey ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => void revoke()}
              className="w-full sm:w-auto"
            >
              {t("linkKeyRevoke")}
            </Button>
          ) : null}
          <ButtonLink
            href={`/${locale}/connect`}
            variant="ghost"
            className="w-full sm:w-auto"
          >
            {t("linkKeyOpenConnect")}
          </ButtonLink>
        </div>
      </CardBody>
    </Card>
  );
}
