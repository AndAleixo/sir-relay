import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { mockChangePassword } from "@/app/actions/mock-auth";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { LogoutButton } from "@/components/auth/logout-button";
import { PasswordFormFields } from "@/components/auth/password-form-fields";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { loginPath } from "@/lib/entry-route";
import { getServices } from "@/services";

const errorKeys = {
  short: "passwordTooShort",
  mismatch: "passwordMismatch",
} as const;

export default async function ChangePasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations();
  const { auth } = getServices();
  const session = await auth.getSession();

  if (!session) {
    redirect(loginPath(locale, { session: "expired" }));
  }

  const mustChangePassword = Boolean(session.user.mustChangePassword);

  async function changePasswordAction(formData: FormData) {
    "use server";
    await mockChangePassword(locale, formData);
  }

  const errorKey =
    error && error in errorKeys
      ? errorKeys[error as keyof typeof errorKeys]
      : null;

  return (
    <div className={authShellStyles.shell}>
      <div className={authShellStyles.loginWrap}>
        <Card>
          <CardBody className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("auth.changePassword")}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {mustChangePassword
                  ? t("auth.changePasswordRequired")
                  : t("auth.changePasswordSubtitle")}
              </p>
            </div>
            {error === "invalid" ? (
              <p className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                {t("auth.loginError")}
              </p>
            ) : null}
            {errorKey ? (
              <p className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                {t(`auth.${errorKey}`)}
              </p>
            ) : null}
            <form action={changePasswordAction} className="space-y-4">
              <PasswordFormFields
                requireCurrent={!mustChangePassword}
                labels={{
                  currentPassword: t("auth.currentPassword"),
                  newPassword: t("auth.newPassword"),
                  confirmPassword: t("auth.confirmPassword"),
                  passwordHint: t("auth.passwordHint"),
                }}
              />
              <Button type="submit" className="w-full">
                {t("auth.changePassword")}
              </Button>
            </form>
            {!mustChangePassword ? (
              <p className="text-center">
                <Link
                  href={`/${locale}/profile`}
                  className="text-sm text-brand-accent hover:text-brand-accent-hover"
                >
                  {t("common.back")}
                </Link>
              </p>
            ) : (
              <div className="flex justify-center pt-1">
                <LogoutButton locale={locale} label={t("common.logout")} variant="ghost" />
              </div>
            )}
          </CardBody>
        </Card>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
