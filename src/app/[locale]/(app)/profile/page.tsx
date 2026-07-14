import { getTranslations } from "next-intl/server";
import {
  profileChangePasswordForm,
  profileUpdateNameForm,
} from "@/app/actions/auth";
import { PageHeader } from "@/components/layout/app-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { ProfileAvatarEditor } from "@/components/profile/profile-avatar-editor";
import { PasswordFormFields } from "@/components/auth/password-form-fields";
import { CopyLinkButton } from "@/components/teammates/copy-link-button";
import { RegenerateTelegramLinkButton } from "@/components/profile/regenerate-telegram-link-button";
import { ToneBadge } from "@/components/ui/badge";
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
    telegramStatus === "pending" ? await users.getTelegramLinkToken(user.id) : null;
  const telegramUrl = telegramToken ? telegramBotUrl(telegramToken) : "";
  const telegramCodePending =
    telegramStatus === "pending" && !telegramUrl
      ? await users.hasActiveTelegramLinkToken(user.id)
      : false;

  const passwordErrorMessage =
    passwordError === "invalid"
      ? t("auth.currentPasswordInvalid")
      : passwordError === "short"
        ? t("auth.passwordTooShort")
        : passwordError === "mismatch"
          ? t("auth.passwordMismatch")
          : null;

  return (
    <>
      <PageHeader title={t("common.account")} />
      <div className="grid max-w-lg gap-4">
        <p className="text-sm text-[var(--text-muted)]">{t("profile.accountScopeHint")}</p>

        {passwordChanged === "1" ? (
          <Banner variant="info">{t("auth.passwordChanged")}</Banner>
        ) : null}
        {nameSaved === "1" ? (
          <Banner variant="info">{t("profile.nameSaved")}</Banner>
        ) : null}

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">{t("profile.accountInfo")}</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ProfileAvatarEditor userId={user.id} userName={user.name} />
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[var(--text-muted)]">{t("auth.email")}</dt>
                <dd className="font-medium text-[var(--text-primary)]">{user.email}</dd>
              </div>
            </dl>
            <form action={profileUpdateNameForm.bind(null, locale)} className="space-y-3">
              <div>
                <Label htmlFor="name">{t("profile.displayName")}</Label>
                <Input id="name" name="name" defaultValue={user.name} required minLength={2} />
              </div>
              {nameError === "short" ? (
                <Banner variant="danger">{t("profile.nameTooShort")}</Banner>
              ) : null}
              <Button type="submit">{t("common.save")}</Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">{t("profile.language")}</h2>
          </CardHeader>
          <CardBody>
            <SettingsLocaleField locale={locale} />
            <p className="mt-2 text-xs text-[var(--text-muted)]">{t("profile.languageHint")}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">{t("profile.passwordSection")}</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {passwordErrorMessage ? (
              <Banner variant="danger">{passwordErrorMessage}</Banner>
            ) : null}
            <form action={profileChangePasswordForm.bind(null, locale)} className="space-y-4">
              <PasswordFormFields
                labels={{
                  currentPassword: t("auth.currentPassword"),
                  newPassword: t("auth.newPassword"),
                  confirmPassword: t("auth.confirmPassword"),
                  passwordHint: t("auth.passwordHint"),
                }}
              />
              <Button type="submit">{t("auth.changePassword")}</Button>
            </form>
          </CardBody>
        </Card>

        {teammate || user.role === "operator" ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">{t("profile.telegramSection")}</h2>
                <ToneBadge tone={telegramStatus === "linked" ? "success" : "warning"}>
                  {telegramStatus === "linked" ? t("teammate.linked") : t("teammate.pending")}
                </ToneBadge>
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
              {telegramStatus === "pending" ? (
                <div className="space-y-3">
                  {telegramUrl ? (
                    <>
                      <div className="flex items-start gap-2">
                        <code className="min-w-0 flex-1 break-all rounded-button bg-[var(--surface-bg)] p-2 text-xs">
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
                      >
                        {t("profile.openTelegramLink")}
                      </ButtonLink>
                    </>
                  ) : telegramCodePending ? (
                    <>
                      <p className="text-xs text-[var(--text-muted)]">
                        {t("profile.telegramActiveCodeHint")}
                      </p>
                      <RegenerateTelegramLinkButton
                        locale={locale}
                        label={t("profile.regenerateTelegramLink")}
                      />
                    </>
                  ) : null}
                </div>
              ) : null}
            </CardBody>
          </Card>
        ) : null}

        <LogoutButton locale={locale} label={t("common.logout")} variant="secondary" />
      </div>
    </>
  );
}
