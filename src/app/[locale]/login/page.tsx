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
import { localeNames, locales, type AppLocale } from "@/i18n/config";
import { getServices } from "@/services";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; session?: string }>;
}) {
  const { locale } = await params;
  const { error, session: sessionParam } = await searchParams;
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
            {error === "invalid" ? (
              <p className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                {t("auth.loginError")}
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
                <Label htmlFor="password">{t("auth.password")}</Label>
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
        <div className="mt-6 flex justify-center gap-2">
          {locales.map((loc) => (
            <Link
              key={loc}
              href={`/${loc}/login`}
              className={
                loc === locale
                  ? "text-sm font-medium text-[var(--text-primary)]"
                  : "text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }
            >
              {localeNames[loc as AppLocale]}
            </Link>
          ))}
        </div>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
