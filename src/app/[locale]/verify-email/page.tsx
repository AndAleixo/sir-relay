import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardBody } from "@/components/ui/card";
import { resolveEntryPath } from "@/lib/entry-route";
import { getServices } from "@/services";

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { token, error } = await searchParams;
  const t = await getTranslations();

  if (token && error !== "invalid") {
    let session;
    try {
      session = await getServices().auth.verifyEmailWithToken(token);
    } catch {
      redirect(`/${locale}/verify-email?error=invalid`);
    }
    redirect(resolveEntryPath(locale, session));
  }

  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className={authShellStyles.loginWrap}>
        <AuthPageHeader locale={locale} />
        <Card>
          <CardBody className="space-y-4 text-center">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {t("auth.verifyTitle")}
            </h1>
            <p className="text-sm text-[var(--severity)]">{t("auth.verifyInvalid")}</p>
            <p className="text-sm text-[var(--text-muted)]">
              <Link
                href={`/${locale}/check-email`}
                className="font-medium text-brand-accent hover:text-brand-accent-hover"
              >
                {t("auth.resendVerification")}
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
