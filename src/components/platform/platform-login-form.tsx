"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  platformLoginAction,
  type PlatformLoginState,
} from "@/app/actions/platform-auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initial: PlatformLoginState = { error: null };

export function PlatformLoginForm({
  locale,
  configured,
}: {
  locale: string;
  configured: boolean;
}) {
  const t = useTranslations("platform");
  const [state, action] = useActionState(
    platformLoginAction.bind(null, locale),
    initial,
  );

  if (!configured) {
    return (
      <p className="text-sm text-[var(--text-muted)]">{t("login.notConfigured")}</p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state.error === "invalid" ? (
        <p className="text-sm text-[var(--severity)]">{t("login.invalid")}</p>
      ) : null}
      <div>
        <Label htmlFor="platform-username">{t("login.username")}</Label>
        <Input
          id="platform-username"
          name="username"
          autoComplete="username"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="platform-password">{t("login.password")}</Label>
        <Input
          id="platform-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1"
        />
      </div>
      <Button type="submit" className="w-full">
        {t("login.submit")}
      </Button>
    </form>
  );
}
