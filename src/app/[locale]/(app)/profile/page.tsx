import { getTranslations } from "next-intl/server";
import {
  mockGenerateTelegramLink,
  mockProfileChangePassword,
} from "@/app/actions/mock-auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { ProfileAvatarEditor } from "@/components/profile/profile-avatar-editor";
import { PasswordFormFields } from "@/components/auth/password-form-fields";
import { ToneBadge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { telegramBotUrl } from "@/lib/app-url";
import { getServices } from "@/services";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ passwordError?: string; passwordChanged?: string }>;
}) {
  const { locale } = await params;
  const { passwordError, passwordChanged } = await searchParams;
  const t = await getTranslations();
  const { auth, teammates, users } = getServices();
  const session = await auth.getSession();
  if (!session) return null;

  const { user } = session;
  const teammate =
    user.role === "teammate" ? await teammates.getTeammate(user.id) : null;

  const telegramToken =
    user.role === "operator" ? await users.getTelegramLinkToken(user.id) : null;
  const telegramUrl =
    user.role === "operator" && user.telegramStatus === "pending" && telegramToken
      ? telegramBotUrl(telegramToken)
      : null;

  const passwordErrorMessage =
    passwordError === "invalid"
      ? t("admin.signInError")
      : passwordError === "short"
        ? t("auth.passwordTooShort")
        : passwordError === "mismatch"
          ? t("auth.passwordMismatch")
          : null;

  return (
    <div className="grid max-w-lg gap-4">
      {passwordChanged === "1" ? (
        <Banner variant="info">{t("auth.passwordChanged")}</Banner>
      ) : null}

      <Card>
        <CardBody className="space-y-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {t("profile.photo")}
            </p>
            <div className="mt-3">
              <ProfileAvatarEditor userId={user.id} userName={user.name} />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {t("profile.accountInfo")}
          </p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">{t("auth.email")}</dt>
              <dd className="font-medium text-[var(--text-primary)]">{user.email}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{t("profile.displayName")}</dt>
              <dd className="font-medium text-[var(--text-primary)]">{user.name}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{t("profile.role")}</dt>
              <dd>
                <span className="inline-flex rounded-full bg-brand-accent-soft px-2.5 py-0.5 text-xs font-medium text-brand-accent">
                  {t(`roles.${user.role}`)}
                </span>
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {t("profile.passwordSection")}
          </p>
          {passwordErrorMessage ? (
            <p className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {passwordErrorMessage}
            </p>
          ) : null}
          <form action={mockProfileChangePassword.bind(null, locale)} className="space-y-4">
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
          <CardBody className="space-y-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {t("profile.telegramSection")}
            </p>
            <ToneBadge
              tone={
                (teammate?.telegramStatus ?? user.telegramStatus) === "linked"
                  ? "success"
                  : "warning"
              }
            >
              {(teammate?.telegramStatus ?? user.telegramStatus) === "linked"
                ? t("teammate.linked")
                : t("teammate.pending")}
            </ToneBadge>
            <p className="text-sm text-[var(--text-muted)]">
              {user.role === "operator"
                ? user.telegramStatus === "linked"
                  ? t("profile.telegramOperatorLinkedHint")
                  : t("profile.telegramOperatorPendingHint")
                : teammate?.telegramStatus === "linked"
                  ? t("profile.telegramLinkedHint")
                  : t("profile.telegramPendingHint")}
            </p>
            {user.role === "operator" && user.telegramStatus === "pending" ? (
              <div className="space-y-3">
                {telegramUrl ? (
                  <>
                    <code className="block break-all rounded-button bg-[var(--surface-bg)] p-2 text-xs">
                      {telegramUrl}
                    </code>
                    <p className="text-xs text-[var(--text-muted)]">
                      {t("profile.telegramLinkCode")}
                    </p>
                  </>
                ) : null}
                <form action={mockGenerateTelegramLink.bind(null, locale)}>
                  <Button type="submit" variant="secondary">
                    {t("profile.generateTelegramLink")}
                  </Button>
                </form>
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardBody>
          <LogoutButton locale={locale} label={t("common.logout")} variant="secondary" />
        </CardBody>
      </Card>
    </div>
  );
}
