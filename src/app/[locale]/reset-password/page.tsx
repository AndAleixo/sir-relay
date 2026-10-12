import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { resetPasswordForm } from "@/app/actions/auth";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { token = "", error } = await searchParams;
  const t = await getTranslations();
  const invalid = !token || error === "invalid";

  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className={authShellStyles.loginWrap}>
        <AuthPageHeader locale={locale} />
        <Card>
          <CardBody className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("auth.resetTitle")}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {t("auth.resetSubtitle")}
              </p>
            </div>
            {invalid ? (
              <p className="rounded-button border border-[var(--severity-soft-hover)] bg-[var(--severity-soft)] px-3 py-2 text-center text-sm text-[var(--severity)]">
                {t("auth.resetInvalid")}
              </p>
            ) : null}
            {error === "weak" ? (
              <p className="rounded-button border border-[var(--severity-soft-hover)] bg-[var(--severity-soft)] px-3 py-2 text-center text-sm text-[var(--severity)]">
                {t("auth.passwordTooWeak")}
              </p>
            ) : null}
            {error === "mismatch" ? (
              <p className="rounded-button border border-[var(--severity-soft-hover)] bg-[var(--severity-soft)] px-3 py-2 text-center text-sm text-[var(--severity)]">
                {t("auth.passwordMismatch")}
              </p>
            ) : null}
            {!invalid ? (
              <form action={resetPasswordForm.bind(null, locale)} className="space-y-4">
                <input type="hidden" name="token" value={token} />
                <div>
                  <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {t("auth.resetSubmit")}
                </Button>
              </form>
            ) : (
              <p className="text-center text-sm">
                <Link
                  href={`/${locale}/forgot-password`}
                  className="font-medium text-brand-accent hover:text-brand-accent-hover"
                >
                  {t("auth.forgotTitle")}
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
