"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDemoActions } from "@/components/demo/demo-provider";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DEMO_NAME_MAX } from "@/lib/demo-workspace";

export function DemoAddMember() {
  const t = useTranslations();
  const { addMember } = useDemoActions();
  const [error, setError] = useState(false);

  return (
    <form
      className="mt-6 max-w-md space-y-3 rounded-card border border-[var(--border)] bg-surface-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const name = String(new FormData(form).get("name") ?? "");
        if (!addMember(name)) {
          setError(true);
          return;
        }
        setError(false);
        form.reset();
      }}
    >
      <p className="text-sm font-medium text-[var(--text-primary)]">
        {t("demo.addTeammate")}
      </p>
      {error ? (
        <p className="text-sm text-[var(--severity)]">{t("demo.nameRequired")}</p>
      ) : null}
      <div>
        <Label htmlFor="demo-member-name">{t("auth.name")}</Label>
        <Input
          id="demo-member-name"
          name="name"
          required
          minLength={2}
          maxLength={DEMO_NAME_MAX}
        />
      </div>
      <Button type="submit">{t("teammate.addTeammate")}</Button>
    </form>
  );
}
