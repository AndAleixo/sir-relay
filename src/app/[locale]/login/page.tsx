import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { mockLogin } from "@/app/actions/mock-auth";
import { MockBanner } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { localeNames, locales, type AppLocale } from "@/i18n/config";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const { auth } = getServices();
  const session = await auth.getSession();
  if (session) redirect(`/${locale}/tasks`);

  return (
    <div className="min-h-screen bg-surface-bg">
      <MockBanner />
      <div className="mx-auto flex min-h-[calc(100vh-36px)] max-w-md flex-col justify-center p-6">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.svg" alt="SirRelay" className="mx-auto h-10" />
        </div>
        <Card>
          <CardBody className="space-y-4">
            <h1 className="text-center text-xl font-semibold">{t("auth.login")}</h1>
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <form action={mockLogin.bind(null, locale, "operator")}>
              <Button type="submit" className="w-full">
                {t("auth.login")} (Operator mock)
              </Button>
            </form>
            <form action={mockLogin.bind(null, locale, "teammate")}>
              <Button type="submit" variant="secondary" className="w-full">
                {t("auth.login")} (Teammate mock)
              </Button>
            </form>
            <p className="text-center text-xs text-[var(--text-muted)]">
              UI preview — any password works with mock buttons.
            </p>
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
    </div>
  );
}
