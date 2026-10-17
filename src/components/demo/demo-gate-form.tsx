"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDemoActions } from "@/components/demo/demo-provider";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { DEMO_NAME_MAX, parseDemoPresets } from "@/lib/demo-workspace";

export function DemoGateForm({ locale }: { locale: string }) {
  const t = useTranslations();
  const router = useRouter();
  const { start } = useDemoActions();
  const presets = parseDemoPresets(t.raw("demo.presets"));
  const [presetId, setPresetId] = useState(presets[0]?.id ?? "");
  const [error, setError] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const name = String(data.get("name") ?? "");
        const preset = presets.find((option) => option.id === presetId);
        if (!preset || !start(name, preset.seed)) {
          setError(true);
          return;
        }
        router.push(`/${locale}/demo/app`);
      }}
    >
      {error ? (
        <p className="rounded-button border border-[var(--severity-soft-hover)] bg-[var(--severity-soft)] px-3 py-2 text-center text-sm text-[var(--severity)]">
          {t("demo.nameRequired")}
        </p>
      ) : null}
      <div>
        <Label htmlFor="name">{t("auth.name")}</Label>
        <Input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={DEMO_NAME_MAX}
          autoComplete="off"
          autoFocus
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {t("demo.nameHint", { max: DEMO_NAME_MAX })}
        </p>
      </div>
      <div>
        <p id="demo-preset-label" className="mb-2 text-sm font-medium text-[var(--text-primary)]">
          {t("demo.presetLabel")}
        </p>
        <div
          role="radiogroup"
          aria-labelledby="demo-preset-label"
          className="grid grid-cols-2 gap-2"
        >
          {presets.map((preset) => {
            const selected = preset.id === presetId;
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={cn(
                  "rounded-button border px-3 py-2 text-sm",
                  selected
                    ? "border-brand-accent bg-brand-accent-soft font-medium text-[var(--text-primary)]"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                )}
                onClick={() => setPresetId(preset.id)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
      <Button type="submit" className="w-full">
        {t("demo.start")}
      </Button>
    </form>
  );
}
