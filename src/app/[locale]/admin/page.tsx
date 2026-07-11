import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { mockLogin } from "@/app/actions/mock-auth";
import { getServices } from "@/services";
import { resolveEntryPath } from "@/lib/entry-route";
import { adminStyles } from "@/components/admin/admin.styles";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { localeNames, locales, type AppLocale } from "@/i18n/config";

export default async function AdminPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; session?: string }>;
}) {
  const { locale } = await params;
  const { error, session: sessionParam } = await searchParams;
  const t = await getTranslations();
  const { auth } = getServices();
  const session = await auth.getSession();

  if (session) {
    redirect(resolveEntryPath(locale, session));
  }

  return (
    <div className={adminStyles.shell}>
      <div className={adminStyles.loginWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt={t("common.appName")} className={adminStyles.loginLogo} />
        <Card>
          <CardBody className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("admin.signInTitle")}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{t("admin.signInSubtitle")}</p>
            </div>
            {sessionParam === "expired" ? (
              <p className="rounded-button border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-900">
                {t("admin.sessionExpired")}
              </p>
            ) : null}
            {error === "invalid" ? (
              <p className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                {t("admin.signInError")}
              </p>
            ) : null}
            <form action={mockLogin.bind(null, locale)} className="space-y-4">
              <div>
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="alex@example.com"
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
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full">
                {t("auth.login")}
              </Button>
            </form>
            <p className="text-center text-xs text-[var(--text-muted)]">
              {t("admin.sessionNotice")}{" "}
              <Link
                href={`/${locale}/privacy`}
                className="text-brand-accent hover:text-brand-accent-hover"
              >
                {t("admin.privacyLink")}
              </Link>
            </p>
            <p className="text-center text-xs text-[var(--text-muted)]">{t("admin.signInMockHint")}</p>
          </CardBody>
        </Card>
        <div className="mt-6 flex justify-center gap-2">
          {locales.map((loc) => (
            <Link
              key={loc}
              href={`/${loc}/admin`}
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
    </div>
  );
}
