import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { mockJoinAccount } from "@/app/actions/mock-auth";
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
  const { auth } = getServices();
  const valid = await auth.isInviteTokenValid(token);

  const errorKey =
    error && error in errorKeys
      ? errorKeys[error as keyof typeof errorKeys]
      : null;

  return (
    <div className={authShellStyles.shell}>
      <div className={authShellStyles.loginWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt={t("common.appName")} className={authShellStyles.loginLogo} />
        <Card>
          <CardBody className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("join.title")}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{t("join.subtitle")}</p>
            </div>
            {!valid ? (
              <p className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                {t("join.invalidToken")}
              </p>
            ) : null}
            {errorKey ? (
              <p className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                {errorKey === "invalidToken"
                  ? t(`join.${errorKey}`)
                  : t(`auth.${errorKey}`)}
              </p>
            ) : null}
            {valid ? (
              <form action={mockJoinAccount.bind(null, locale, token)} className="space-y-4">
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
            <p className="text-center">
              <Link
                href={`/${locale}/login`}
                className="text-sm text-brand-accent hover:text-brand-accent-hover"
              >
                {t("auth.login")}
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
