import { getTranslations } from "next-intl/server";
import {
  profileChangePasswordForm,
  profileUpdateNameForm,
  regenerateTelegramLinkAction,
} from "@/app/actions/auth";
import { PageHeader } from "@/components/layout/app-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { ProfileAvatarEditor } from "@/components/profile/profile-avatar-editor";
import { PasswordFormFields } from "@/components/auth/password-form-fields";
import { CopyLinkButton } from "@/components/teammates/copy-link-button";
import { RegenerateTelegramLinkButton } from "@/components/profile/regenerate-telegram-link-button";
import { TelegramStatusIcon } from "@/components/ui/telegram-status-icon";
import { Banner } from "@/components/ui/banner";
import { Button, ButtonLink } from "@/components/ui/button";
import { SettingsLocaleField } from "@/components/settings/settings-locale-field";
import { Input, Label } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { telegramBotUrl } from "@/lib/app-url";
import { requireSession } from "@/lib/require-session";
import { getServices } from "@/services";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    passwordError?: string;
    passwordChanged?: string;
    nameError?: string;
    nameSaved?: string;
  }>;
}) {
  const { locale } = await params;
  const { passwordError, passwordChanged, nameError, nameSaved } = await searchParams;
  const t = await getTranslations();
  const session = await requireSession(locale);
  const { teammates, users } = getServices();
  const { user } = session;
  const teammate =
    user.role === "teammate" ? await teammates.getTeammate(user.id, { session }) : null;

  const telegramStatus = teammate?.telegramStatus ?? user.telegramStatus;
  const telegramToken =
    telegramStatus === "pending"
      ? await users.getTelegramLinkToken(user.id, { session })
      : null;
  const telegramUrl = telegramToken ? telegramBotUrl(telegramToken) : "";

  const passwordErrorMessage =
    passwordError === "invalid"
      ? t("auth.currentPasswordInvalid")
      : passwordError === "short" || passwordError === "weak"
        ? t(passwordError === "weak" ? "auth.passwordTooWeak" : "auth.passwordTooShort")
        : passwordError === "mismatch"
          ? t("auth.passwordMismatch")
          : null;

  const showTelegram = Boolean(teammate || user.role === "operator");

  return (
    <>
      <PageHeader
        title={t("common.account")}
        subtitle={t("profile.accountScopeHint")}
      />
      <div className="grid max-w-3xl gap-3 md:max-w-4xl md:grid-cols-2 md:gap-4">
        {passwordChanged === "1" ? (
          <Banner variant="info" className="md:col-span-2">
            {t("auth.passwordChanged")}
          </Banner>
        ) : null}
        {nameSaved === "1" ? (
          <Banner variant="info" className="md:col-span-2">
            {t("profile.nameSaved")}
          </Banner>
        ) : null}

        <Card className="min-w-0">
          <CardHeader>
            <h2 className="text-sm font-semibold">{t("profile.accountInfo")}</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ProfileAvatarEditor userId={user.id} userName={user.name || user.email} />
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
              <Label htmlFor="name">{t("profile.accountName")}</Label>
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
              <p className="text-xs text-[var(--text-muted)]">
                {t("profile.accountNameHint")}
              </p>
              {nameError === "short" ? (
                <Banner variant="danger">{t("profile.nameTooShort")}</Banner>
              ) : null}
            </form>
            <div className="space-y-2 border-t border-[var(--border)] pt-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {t("profile.language")}
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
              <Banner variant="danger">{passwordErrorMessage}</Banner>
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

        <div className="md:col-span-2">
          <LogoutButton
            locale={locale}
            label={t("common.logout")}
            variant="secondary"
            className="w-full sm:w-auto"
          />
        </div>
      </div>
    </>
  );
}
