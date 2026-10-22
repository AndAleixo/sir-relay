"use client";

import { useTranslations } from "next-intl";
import {
  profileChangePasswordForm,
  profileUpdateNameForm,
  regenerateTelegramLinkAction,
} from "@/app/actions/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { PasswordFormFields } from "@/components/auth/password-form-fields";
import { LinkTokenCard } from "@/components/profile/link-token-card";
import { ProfileAvatarEditor } from "@/components/profile/profile-avatar-editor";
import { RegenerateTelegramLinkButton } from "@/components/profile/regenerate-telegram-link-button";
import { CopyLinkButton } from "@/components/teammates/copy-link-button";
import { SettingsLocaleField } from "@/components/settings/settings-locale-field";
import { Banner } from "@/components/ui/banner";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { TelegramStatusIcon } from "@/components/ui/telegram-status-icon";
import type { TelegramLinkStatus, User } from "@/domain/types";
import type { ClientApiKeyPublic } from "@/lib/link-token";
import type { ApiKeyGroupOption } from "@/components/profile/link-token-card";

export type AccountProfileProps = {
  locale: string;
  user: User;
  apiKeys: ClientApiKeyPublic[];
  apiKeyGroups: ApiKeyGroupOption[];
  telegramStatus: TelegramLinkStatus;
  telegramUrl: string;
  showTelegram: boolean;
  nameError?: string;
  passwordErrorMessage?: string | null;
};

export function AccountProfile({
  locale,
  user,
  apiKeys,
  apiKeyGroups,
  telegramStatus,
  telegramUrl,
  showTelegram,
  nameError,
  passwordErrorMessage,
}: AccountProfileProps) {
  const t = useTranslations();

  return (
    <div className="grid max-w-3xl gap-3 md:max-w-4xl md:grid-cols-2 md:gap-4">
      <Card className="min-w-0">
        <CardHeader>
          <h2 className="text-sm font-semibold">{t("profile.accountInfo")}</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <ProfileAvatarEditor
            userId={user.id}
            userName={user.name || user.email}
          />
          <dl className="text-sm">
            <dt className="text-[var(--text-muted)]">{t("auth.email")}</dt>
            <dd className="min-w-0 break-all font-medium text-[var(--text-primary)]">
              {user.email}
            </dd>
          </dl>
          <form
            action={profileUpdateNameForm.bind(null, locale)}
            className="space-y-2 border-t border-[var(--border)] pt-3"
          >
              <div>
                <Label htmlFor="name" className="mb-0">
                  {t("profile.accountName")}
                </Label>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {t("profile.accountNameHint")}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Input
                  id="name"
                  name="name"
                  className="min-w-0 flex-1"
                  defaultValue={user.name}
                  required
                  minLength={2}
                />
                <Button type="submit" className="w-full shrink-0 sm:w-auto">
                  {t("common.save")}
                </Button>
              </div>
              {nameError === "short" ? (
                <Banner variant="severity">{t("profile.nameTooShort")}</Banner>
              ) : null}
          </form>
          <div className="space-y-2 border-t border-[var(--border)] pt-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {t("common.language")}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {t("profile.languageHint")}
              </p>
            </div>
            <SettingsLocaleField locale={locale} />
          </div>
        </CardBody>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <h2 className="text-sm font-semibold">{t("profile.passwordSection")}</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {t("auth.changePasswordSubtitle")}
          </p>
        </CardHeader>
        <CardBody className="space-y-3">
          {passwordErrorMessage ? (
            <Banner variant="severity">{passwordErrorMessage}</Banner>
          ) : null}
          <form
            action={profileChangePasswordForm.bind(null, locale)}
            className="space-y-3"
          >
              <PasswordFormFields
                labels={{
                  currentPassword: t("auth.currentPassword"),
                  newPassword: t("auth.newPassword"),
                  confirmPassword: t("auth.confirmPassword"),
                  passwordHint: t("auth.passwordHint"),
                }}
              />
              <Button type="submit" className="w-full sm:w-auto">
                {t("auth.changePassword")}
              </Button>
          </form>
        </CardBody>
      </Card>

      <LinkTokenCard
        locale={locale}
        initialKeys={apiKeys}
        groups={apiKeyGroups}
      />

      {showTelegram ? (
        <Card className="min-w-0 md:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">{t("profile.telegramSection")}</h2>
              <TelegramStatusIcon
                status={telegramStatus === "linked" ? "linked" : "pending"}
                label={
                  telegramStatus === "linked"
                    ? t("teammate.linked")
                    : t("teammate.pending")
                }
              />
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-[var(--text-muted)]">
              {telegramStatus === "linked"
                ? user.role === "operator"
                  ? t("profile.telegramLinkedHintOperator")
                  : t("profile.telegramLinkedHintTeammate")
                : user.role === "operator"
                  ? t("profile.telegramOperatorPendingHint")
                  : t("profile.telegramTeammatePendingHint")}
            </p>
            {telegramStatus === "linked" ? (
              <form action={regenerateTelegramLinkAction.bind(null, locale)}>
                <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                  {t("profile.unlinkTelegram")}
                </Button>
              </form>
            ) : null}
            {telegramStatus === "pending" && telegramUrl ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-start gap-2">
                  <code className="min-w-0 flex-1 basis-full break-all rounded-button bg-[var(--surface-bg)] p-2 text-xs sm:basis-0">
                    {telegramUrl}
                  </code>
                  <RegenerateTelegramLinkButton
                    locale={locale}
                    label={t("profile.regenerateTelegramLink")}
                  />
                  <CopyLinkButton
                    text={telegramUrl}
                    label={t("common.copy")}
                    copiedLabel={t("common.copied")}
                  />
                </div>
                <ButtonLink
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  {t("profile.openTelegramLink")}
                </ButtonLink>
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
        <LogoutButton
          locale={locale}
          label={t("common.logout")}
          variant="secondary"
          className="w-full sm:w-auto"
        />
        <ButtonLink
          href={`/${locale}/profile/delete`}
          variant="ghost"
          className="w-full text-[var(--severity)] hover:bg-[var(--severity-soft)] hover:text-[var(--severity)] sm:w-auto"
        >
          {t("profile.deleteAccount")}
        </ButtonLink>
      </div>
    </div>
  );
}
