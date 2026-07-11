import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { mockAcceptInvite } from "@/app/actions/mock-groups";
import { mockJoinAccount } from "@/app/actions/mock-auth";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { PasswordFormFields } from "@/components/auth/password-form-fields";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getServices } from "@/services";

const errorKeys = {
  short: "passwordTooShort",
  mismatch: "passwordMismatch",
  invalid: "invalidToken",
  email_mismatch: "emailMismatch",
} as const;

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale, token } = await params;
  const { error } = await searchParams;
  const t = await getTranslations();
  const { auth, groups } = getServices();
  const preview = await groups.previewInvite(token);
  const session = await auth.getSession();

  const errorKey =
    error && error in errorKeys
      ? errorKeys[error as keyof typeof errorKeys]
      : null;

  const emailMatches =
    preview && session
      ? session.user.email.toLowerCase() === preview.email.toLowerCase()
      : false;

  const canAcceptLoggedIn =
    preview && session && emailMatches && !preview.needsPassword;

  return (
    <div className={authShellStyles.shell}>
      <div className={authShellStyles.loginWrap}>
        <AuthPageHeader locale={locale} />
        <Card>
          <CardBody className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("join.title")}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {preview
                  ? t("join.subtitleNamed", {
                      group: preview.groupName,
                      role: t(`roles.${preview.role}`),
                    })
                  : t("join.subtitle")}
              </p>
            </div>

            {!preview ? (
              <p className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                {t("join.invalidToken")}
              </p>
            ) : null}

            {errorKey ? (
              <p className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                {errorKey === "invalidToken" || errorKey === "emailMismatch"
                  ? t(`join.${errorKey}`)
                  : t(`auth.${errorKey}`)}
              </p>
            ) : null}

            {preview && session && !emailMatches ? (
              <p className="rounded-button border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-900">
                {t("join.wrongAccount", { email: preview.email })}
              </p>
            ) : null}

            {canAcceptLoggedIn ? (
              <form action={mockAcceptInvite.bind(null, locale, token)}>
                <Button type="submit" className="w-full">
                  {t("join.accept", { group: preview.groupName })}
                </Button>
              </form>
            ) : null}

            {preview?.needsPassword && (!session || emailMatches) ? (
              <form action={mockJoinAccount.bind(null, locale, token)} className="space-y-4">
                {preview ? (
                  <p className="text-center text-xs text-[var(--text-muted)]">
                    {t("join.accountEmail", { email: preview.email })}
                  </p>
                ) : null}
                <PasswordFormFields
                  requireCurrent={false}
                  labels={{
                    currentPassword: t("auth.currentPassword"),
                    newPassword: t("auth.newPassword"),
                    confirmPassword: t("auth.confirmPassword"),
                    passwordHint: t("auth.passwordHint"),
                  }}
                />
                <Button type="submit" className="w-full">
                  {t("join.submit")}
                </Button>
              </form>
            ) : null}

            {!session ? (
              <p className="text-center">
                <Link
                  href={`/${locale}/login`}
                  className="text-sm text-brand-accent hover:text-brand-accent-hover"
                >
                  {t("auth.login")}
                </Link>
              </p>
            ) : (
              <p className="text-center">
                <Link
                  href={`/${locale}/groups`}
                  className="text-sm text-brand-accent hover:text-brand-accent-hover"
                >
                  {t("groups.title")}
                </Link>
              </p>
            )}
          </CardBody>
        </Card>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
