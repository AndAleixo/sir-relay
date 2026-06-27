import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { switchMockRole, mockLogout } from "@/app/actions/mock-auth";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { getServices } from "@/services";
import { localeNames, locales, type AppLocale } from "@/i18n/config";

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
              <Select id="locale" defaultValue={session.user.locale} disabled>
                {locales.map((loc) => (
                  <option key={loc} value={loc}>
                    {localeNames[loc as AppLocale]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>{t("settings.password")}</Label>
              <Button variant="secondary" className="mt-1.5">
                {t("auth.changePassword")}
              </Button>
            </div>
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

        <form action={mockLogout.bind(null, locale)}>
          <Button type="submit" variant="ghost">
            {t("common.logout")}
          </Button>
        </form>
      </div>
    </>
  );
}
