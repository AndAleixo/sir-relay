"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  createClientApiKeyAction,
  deleteClientApiKeyAction,
} from "@/app/actions/connect";
import { ConnectKeyReveal } from "@/components/connect/connect-key-reveal";
import { ConnectMcpHelp } from "@/components/connect/connect-mcp-help";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { ClientApiKeyPublic } from "@/lib/link-token";

export type ApiKeyGroupOption = { id: string; name: string };

export function ConnectClient({
  scheme,
  appUrl,
  initialKeys,
  groups,
}: {
  scheme: string;
  appUrl: string;
  initialKeys: ClientApiKeyPublic[];
  groups: ApiKeyGroupOption[];
}) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [allGroups, setAllGroups] = useState(true);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<{
    id: string;
    token: string;
  } | null>(null);
  const [creating, setCreating] = useState(initialKeys.length === 0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

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

  function resetForm() {
    setName("");
    setAllGroups(true);
    setSelectedGroupIds([]);
    setCreating(false);
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
    resetForm();
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
    setKeys((prev) => {
      const next = prev.filter((k) => k.id !== keyId);
      if (next.length === 0) setCreating(true);
      return next;
    });
    if (revealed?.id === keyId) setRevealed(null);
  }

  function openHelp() {
    setHelpOpen(true);
    window.requestAnimationFrame(() => {
      document.getElementById("mcp-setup-help")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }

  return (
    <div className="space-y-5 text-left">
      {error ? <Banner variant="severity">{error}</Banner> : null}

      {revealed ? (
        <ConnectKeyReveal
          scheme={scheme}
          appUrl={appUrl}
          token={revealed.token}
          onOpenHelp={openHelp}
        />
      ) : null}

      {keys.length > 0 ? (
        <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {keys.map((key) => (
            <li
              key={key.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {key.name}
                </p>
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  {key.prefix}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {permissionsLabel(key)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => void onDelete(key.id)}
                className="w-full shrink-0 text-[var(--severity)] hover:bg-[var(--severity-soft)] hover:text-[var(--severity)] sm:w-auto"
              >
                {t("linkKeyDelete")}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {creating ? (
        <form onSubmit={(e) => void onCreate(e)} className="space-y-4">
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
            <legend className="mb-1 text-sm font-medium text-[var(--text-primary)]">
              {t("linkKeyPermissions")}
            </legend>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
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
                <p className="text-xs text-[var(--text-muted)]">{t("linkKeyNoGroups")}</p>
              ) : (
                <div className="flex flex-col gap-1.5 pl-0.5">
                  {groups.map((g) => (
                    <label
                      key={g.id}
                      className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]"
                    >
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
            {keys.length > 0 ? (
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  resetForm();
                  setError(null);
                }}
                className="w-full sm:w-auto"
              >
                {tCommon("cancel")}
              </Button>
            ) : null}
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

      <ConnectMcpHelp open={helpOpen} onToggle={setHelpOpen} />
    </div>
  );
}
