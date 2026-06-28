import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { switchMockRole } from "@/app/actions/mock-auth";
import { LocaleSwitcher } from "@/components/layout/app-shell/locale-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Label } from "@/components/ui/input";
import { getServices } from "@/services";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const { auth } = getServices();
  const session = await auth.getSession();
  if (!session) return null;

  return (
    <>
      <PageHeader title={t("settings.title")} />
      <div className="grid max-w-lg gap-4">
        <Card>
          <CardBody className="space-y-4">
            <div>
              <Label htmlFor="locale">{t("settings.locale")}</Label>
              <div className="mt-1.5">
                <LocaleSwitcher locale={locale} />
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">{t("settings.localeHint")}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {t("settings.notifications")}
            </p>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span className="text-[var(--text-primary)]">{t("settings.taskUpdates")}</span>
              <input type="checkbox" defaultChecked disabled className="h-4 w-4 rounded" />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span className="text-[var(--text-primary)]">{t("settings.telegramAlerts")}</span>
              <input type="checkbox" defaultChecked disabled className="h-4 w-4 rounded" />
            </label>
            <p className="text-xs text-[var(--text-muted)]">{t("settings.notificationsHint")}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <p className="text-sm font-medium">{t("settings.mockRole")}</p>
            <div className="flex flex-wrap gap-2">
              <form action={switchMockRole.bind(null, locale, "operator")}>
                <Button type="submit" variant="secondary">
                  {t("settings.switchOperator")}
                </Button>
              </form>
              <form action={switchMockRole.bind(null, locale, "teammate")}>
                <Button type="submit" variant="secondary">
                  {t("settings.switchTeammate")}
                </Button>
              </form>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {t("settings.accountSection")}
            </p>
            <p className="text-sm text-[var(--text-muted)]">{t("settings.accountSectionHint")}</p>
            <Link href={`/${locale}/profile`}>
              <Button variant="secondary">{t("common.profile")}</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
