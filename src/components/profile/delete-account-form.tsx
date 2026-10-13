"use client";

import { useTranslations } from "next-intl";
import { deleteAccountForm } from "@/app/actions/auth";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function DeleteAccountForm({
  locale,
  error,
}: {
  locale: string;
  error?: string;
}) {
  const t = useTranslations();

  return (
    <div className="space-y-3">
      {error === "invalid" ? (
        <Banner variant="severity">{t("auth.currentPasswordInvalid")}</Banner>
      ) : null}
      {error === "failed" ? (
        <Banner variant="severity">{t("profile.deleteAccountFailed")}</Banner>
      ) : null}
      <form
        action={deleteAccountForm.bind(null, locale)}
        className="space-y-3"
        onSubmit={(event) => {
          if (!window.confirm(t("profile.deleteAccountConfirm"))) {
            event.preventDefault();
          }
        }}
      >
        <div>
          <Label htmlFor="deletePassword">{t("auth.currentPassword")}</Label>
          <Input
            id="deletePassword"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" variant="severity" className="w-full sm:w-auto">
          {t("profile.deleteAccount")}
        </Button>
      </form>
    </div>
  );
}
