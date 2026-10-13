import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { confirmEmailVerificationForm } from "@/app/actions/auth";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { token = "", error } = await searchParams;
  const t = await getTranslations();
  const invalid = error === "invalid" || !token;

  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className={authShellStyles.loginWrap}>
        <AuthPageHeader locale={locale} />
        <Card>
          <CardBody className="space-y-4 text-center">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {t("auth.verifyTitle")}
            </h1>
            {invalid ? (
              <>
                <p className="text-sm text-[var(--severity)]">{t("auth.verifyInvalid")}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  <Link
                    href={`/${locale}/check-email`}
                    className="font-medium text-brand-accent hover:text-brand-accent-hover"
                  >
                    {t("auth.resendVerification")}
                  </Link>
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--text-muted)]">
                  {t("auth.verifyConfirmHint")}
                </p>
                <form action={confirmEmailVerificationForm.bind(null, locale)}>
                  <input type="hidden" name="token" value={token} />
                  <Button type="submit" className="w-full">
                    {t("auth.verifyConfirm")}
                  </Button>
                </form>
              </>
            )}
          </CardBody>
        </Card>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
