import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { GroupDangerSettings } from "@/components/settings/group-danger-settings";
import { OperatorAlertSettings } from "@/components/settings/operator-alert-settings";
import { Card, CardBody } from "@/components/ui/card";
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
        subtitle={activeGroup?.name}
      />
      <div className="grid max-w-lg gap-4">
        {activeGroup ? (
          <p className="text-sm text-[var(--text-muted)]">
            {t("settings.groupScopeHint", { group: activeGroup.name })}
          </p>
        ) : null}

        {!isOperator ? (
          <p className="text-sm text-[var(--text-muted)]">{t("settings.teammateHint")}</p>
        ) : null}

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
