import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { OperatorAlertSettings } from "@/components/settings/operator-alert-settings";
import { SettingsLocaleField } from "@/components/settings/settings-locale-field";
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
  const { auth, alerts } = getServices();
  const session = await auth.getSession();
  if (!session) return null;

  const isOperator = session.user.role === "operator";
  const alertPrefs = isOperator ? await alerts.getPrefs() : null;

  return (
    <>
      <PageHeader title={t("settings.title")} />
      <div className="grid max-w-lg gap-4">
        <Card>
          <CardBody className="space-y-4">
            <div>
              <Label htmlFor="locale">{t("settings.locale")}</Label>
              <div className="mt-1.5">
                <SettingsLocaleField locale={locale} />
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">{t("settings.localeHint")}</p>
            </div>
          </CardBody>
        </Card>

        {isOperator && alertPrefs ? (
          <Card>
            <CardBody>
              <OperatorAlertSettings
                taskDone={alertPrefs.taskDone}
                taskDue={alertPrefs.taskDue}
                labels={{
                  operatorSection: t("settings.operatorAlerts"),
                  operatorSectionHint: t("settings.operatorAlertsHint"),
                  taskDone: t("settings.alertTaskDone"),
                  taskDoneHint: t("settings.alertTaskDoneHint"),
                  taskDue: t("settings.alertTaskDue"),
                  taskDueHint: t("settings.alertTaskDueHint"),
                }}
              />
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}
