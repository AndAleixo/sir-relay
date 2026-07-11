import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { requireRole } from "@/lib/require-session";
import { OperatorAlertsList } from "@/components/alerts/operator-alerts-list";

export default async function AlertsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const { auth, tasks, alerts } = getServices();
  const session = await auth.getSession();
  if (!session) return null;
  requireRole(session, "operator", locale);

  const taskList = await tasks.listTasks({ session });
  await alerts.syncDueAlerts(taskList);
  const alertList = await alerts.listRecentAlerts(50);

  return (
    <>
      <p className="mb-4 text-sm text-[var(--text-muted)]">{t("alerts.subtitle")}</p>
      <OperatorAlertsList
        alerts={alertList}
        locale={locale}
        labels={{
          empty: t("alerts.empty"),
          taskDone: t("alerts.taskDone"),
          taskDue: t("alerts.taskDue"),
          sentToTelegram: t("alerts.sentToTelegram"),
          webOnly: t("alerts.webOnly"),
        }}
      />
    </>
  );
}
