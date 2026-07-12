import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { GroupDangerSettings } from "@/components/settings/group-danger-settings";
import { OperatorAlertSettings } from "@/components/settings/operator-alert-settings";
import { Banner } from "@/components/ui/banner";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireAppSession } from "@/lib/require-session";
import { getServices } from "@/services";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const session = await requireAppSession(locale);
  const { alerts, groups } = getServices();

  const groupList = await groups.listForUser(session.user.id);
  const activeGroup =
    groupList.find((group) => group.id === session.activeGroupId) ?? null;
  const isOperator = session.user.role === "operator";
  const alertPrefs = isOperator ? await alerts.getPrefs({ session }) : null;

  return (
    <>
      <PageHeader
        title={t("settings.title")}
        subtitle={
          activeGroup ? t("settings.pageSubtitle", { group: activeGroup.name }) : undefined
        }
      />
      <div className="grid max-w-xl gap-4">
        {isOperator && alertPrefs ? (
          <>
            {session.user.telegramStatus === "pending" ? (
              <Banner variant="warning">
                {t("settings.linkTelegram")}{" "}
                <Link
                  href={`/${locale}/profile`}
                  className="font-medium underline underline-offset-2"
                >
                  {t("common.account")}
                </Link>
              </Banner>
            ) : null}
            <Card>
              <CardBody>
                <OperatorAlertSettings
                  taskDone={alertPrefs.taskDone}
                  taskDue={alertPrefs.taskDue}
                  viewAlertsHref={`/${locale}/alerts`}
                  labels={{
                    operatorSection: t("settings.operatorAlerts"),
                    operatorSectionHint: t("settings.operatorAlertsHint"),
                    taskDone: t("settings.alertTaskDone"),
                    taskDoneHint: t("settings.alertTaskDoneHint"),
                    taskDue: t("settings.alertTaskDue"),
                    taskDueHint: t("settings.alertTaskDueHint"),
                    viewAlertHistory: t("settings.viewAlertHistory"),
                  }}
                />
              </CardBody>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">{t("settings.notifications")}</h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-[var(--text-muted)]">
                {t("settings.teammateNotificationsHint")}
              </p>
            </CardBody>
          </Card>
        )}

        {activeGroup ? (
          <Card>
            <CardBody>
              <GroupDangerSettings locale={locale} group={activeGroup} />
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}
