import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { resendVerificationForm } from "@/app/actions/auth";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export default async function CheckEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ resent?: string }>;
}) {
  const { locale } = await params;
  const { resent } = await searchParams;
  const t = await getTranslations();

  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className={authShellStyles.loginWrap}>
        <AuthPageHeader locale={locale} />
        <Card>
          <CardBody className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("auth.checkEmailTitle")}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {t("auth.checkEmailSubtitle")}
              </p>
            </div>
            {resent === "1" ? (
              <p className="rounded-button border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-900">
                {t("auth.checkEmailResent")}
              </p>
            ) : null}
            <form action={resendVerificationForm.bind(null, locale)} className="space-y-4">
              <div>
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <Button type="submit" variant="secondary" className="w-full">
                {t("auth.resendVerification")}
              </Button>
            </form>
            <p className="text-center text-sm text-[var(--text-muted)]">
              <Link
                href={`/${locale}/login`}
                className="font-medium text-brand-accent hover:text-brand-accent-hover"
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
