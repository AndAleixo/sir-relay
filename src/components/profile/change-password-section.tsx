"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ChangePasswordSection() {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="current-password">{t("auth.currentPassword")}</Label>
        <Input id="current-password" type="password" autoComplete="current-password" />
      </div>
      <div>
        <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
        <Input id="new-password" type="password" autoComplete="new-password" />
      </div>
      <Button type="button" disabled>
        {t("auth.changePassword")}
      </Button>
      <p className="text-xs text-[var(--text-muted)]">{t("profile.passwordMockHint")}</p>
    </div>
  );
}
