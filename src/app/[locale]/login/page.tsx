import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { loginForm } from "@/app/actions/auth";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { resolveEntryPath } from "@/lib/entry-route";
import { getServices } from "@/services";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    error?: string;
    session?: string;
    reset?: string;
    email?: string;
  }>;
}) {
  const { locale } = await params;
  const { error, session: sessionParam, reset, email: emailParam } = await searchParams;
  const checkEmailHref = emailParam?.includes("@")
    ? `/${locale}/check-email?email=${encodeURIComponent(emailParam.trim().toLowerCase())}`
    : `/${locale}/check-email`;
  const t = await getTranslations();
  const session = await getServices().auth.getSession();

  if (session) {
    redirect(resolveEntryPath(locale, session));
  }

  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className={authShellStyles.loginWrap}>
        <AuthPageHeader locale={locale} />
        <Card>
          <CardBody className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("auth.loginTitle")}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{t("auth.loginSubtitle")}</p>
            </div>
            {sessionParam === "expired" ? (
              <p className="rounded-button border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-900">
                {t("auth.sessionExpired")}
              </p>
            ) : null}
            {reset === "1" ? (
              <p className="rounded-button border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-900">
                {t("auth.resetDone")}
              </p>
            ) : null}
            {error === "invalid" ? (
              <p className="rounded-button border border-[var(--severity-soft-hover)] bg-[var(--severity-soft)] px-3 py-2 text-center text-sm text-[var(--severity)]">
                {t("auth.loginError")}
              </p>
            ) : null}
            {error === "unverified" ? (
              <p className="rounded-button border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-900">
                {t("auth.loginUnverified")}{" "}
                <Link href={checkEmailHref} className="font-medium underline">
                  {t("auth.resendVerification")}
                </Link>
              </p>
            ) : null}
            <form action={loginForm.bind(null, locale)} className="space-y-4">
              <div>
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="sam@example.com"
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <Label htmlFor="password" className="mb-0">
                    {t("auth.password")}
                  </Label>
                  <Link
                    href={`/${locale}/forgot-password`}
                    className="text-xs font-medium text-brand-accent hover:text-brand-accent-hover"
                  >
                    {t("auth.forgotLink")}
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full">
                {t("auth.login")}
              </Button>
            </form>
            <p className="text-center text-sm text-[var(--text-muted)]">
              {t("auth.noAccount")}{" "}
              <Link
                href={`/${locale}/signup`}
                className="font-medium text-brand-accent hover:text-brand-accent-hover"
              >
                {t("auth.signup")}
              </Link>
            </p>
            <p className="text-center text-xs text-[var(--text-muted)]">{t("auth.sessionNotice")}</p>
          </CardBody>
        </Card>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
