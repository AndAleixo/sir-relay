"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  createClientApiKeyAction,
  deleteClientApiKeyAction,
} from "@/app/actions/connect";
import { CopyLinkButton } from "@/components/teammates/copy-link-button";
import { Banner } from "@/components/ui/banner";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import type { ClientApiKeyPublic } from "@/lib/link-token";

export type ApiKeyGroupOption = { id: string; name: string };

export function LinkTokenCard({
  locale,
  initialKeys,
  groups,
}: {
  locale: string;
  initialKeys: ClientApiKeyPublic[];
  groups: ApiKeyGroupOption[];
}) {
  const t = useTranslations("profile");
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [allGroups, setAllGroups] = useState(true);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<{
    id: string;
    token: string;
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupNameById = useMemo(() => {
    const map = new Map(groups.map((g) => [g.id, g.name]));
    return map;
  }, [groups]);

  function permissionsLabel(key: ClientApiKeyPublic): string {
    if (key.groupIds.length === 0) return t("linkKeyPermAll");
    return key.groupIds
      .map((id) => groupNameById.get(id) ?? id)
      .join(", ");
  }

  function toggleGroup(id: string) {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const groupIds = allGroups ? [] : selectedGroupIds;
    if (!allGroups && groupIds.length === 0) {
      setPending(false);
      setError(t("linkKeyNeedGroup"));
      return;
    }
    const result = await createClientApiKeyAction({ name, groupIds });
    setPending(false);
    if ("error" in result) {
      setError(
        result.error === "bad_name"
          ? t("linkKeyBadName")
          : result.error === "limit"
            ? t("linkKeyLimit")
            : result.error === "bad_groups"
              ? t("linkKeyBadGroups")
              : t("linkKeyUnauthorized"),
      );
      return;
    }
    setKeys((prev) => [result.key, ...prev]);
    setRevealed({ id: result.key.id, token: result.token });
    setName("");
    setCreating(false);
    setAllGroups(true);
    setSelectedGroupIds([]);
  }

  async function onDelete(keyId: string) {
    if (!window.confirm(t("linkKeyDeleteConfirm"))) return;
    setPending(true);
    setError(null);
    const result = await deleteClientApiKeyAction(keyId);
    setPending(false);
    if ("error" in result) {
      setError(
        result.error === "unauthorized"
          ? t("linkKeyUnauthorized")
          : t("linkKeyDeleteFailed"),
      );
      return;
    }
    setKeys((prev) => prev.filter((k) => k.id !== keyId));
    if (revealed?.id === keyId) setRevealed(null);
  }

  return (
    <Card className="min-w-0 md:col-span-2">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">{t("linkKeySection")}</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {t("linkKeyHint")}
            </p>
          </div>
          <ButtonLink
            href={`/${locale}/connect`}
            variant="ghost"
            className="shrink-0"
          >
            {t("linkKeyOpenConnect")}
          </ButtonLink>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {error ? <Banner variant="severity">{error}</Banner> : null}

        {revealed ? (
          <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--surface-bg)] p-3">
            <Banner variant="info">{t("linkKeyShownOnce")}</Banner>
            <div className="flex flex-wrap items-start gap-2">
              <p className="min-w-0 flex-1 break-all font-mono text-xs">
                {revealed.token}
              </p>
              <CopyLinkButton
                showLabel
                text={revealed.token}
                label={t("linkKeyCopy")}
                copiedLabel={t("linkKeyCopied")}
              />
            </div>
          </div>
        ) : null}

        {keys.length === 0 && !creating ? (
          <p className="text-sm text-[var(--text-muted)]">{t("linkKeyNone")}</p>
        ) : null}

        {keys.length > 0 ? (
          <ul className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)]">
            {keys.map((key) => (
              <li
                key={key.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {key.name}
                  </p>
                  <p className="font-mono text-xs text-[var(--text-muted)]">
                    {key.prefix}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t("linkKeyPermissions")}: {permissionsLabel(key)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => void onDelete(key.id)}
                  className="w-full shrink-0 sm:w-auto"
                >
                  {t("linkKeyDelete")}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        {creating ? (
          <form onSubmit={(e) => void onCreate(e)} className="space-y-3 rounded-md border border-[var(--border)] p-3">
            <div>
              <Label htmlFor="api-key-name">{t("linkKeyName")}</Label>
              <Input
                id="api-key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                required
                placeholder={t("linkKeyNamePlaceholder")}
                className="mt-1"
                autoFocus
              />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-[var(--text-primary)]">
                {t("linkKeyPermissions")}
              </legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={allGroups}
                  onChange={(e) => {
                    setAllGroups(e.target.checked);
                    if (e.target.checked) setSelectedGroupIds([]);
                  }}
                />
                {t("linkKeyPermAll")}
              </label>
              {!allGroups ? (
                groups.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    {t("linkKeyNoGroups")}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5 pl-1">
                    {groups.map((g) => (
                      <label key={g.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(g.id)}
                          onChange={() => toggleGroup(g.id)}
                        />
                        {g.name}
                      </label>
                    ))}
                  </div>
                )
              ) : null}
            </fieldset>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                {pending ? t("linkKeyWorking") : t("linkKeyCreate")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  setCreating(false);
                  setError(null);
                }}
                className="w-full sm:w-auto"
              >
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            disabled={pending}
            onClick={() => {
              setCreating(true);
              setError(null);
            }}
            className="w-full sm:w-auto"
          >
            {t("linkKeyCreate")}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
