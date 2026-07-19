import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/layout/app-shell";
import { OperatorAlertsList } from "@/components/alerts/operator-alerts-list";

export default async function EventsPage({
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
  await alerts.syncDueAlerts(taskList, { session });
  const alertList = await alerts.listRecentAlerts({ session }, 50);

  return (
    <>
      <PageHeader
        title={t("events.title")}
        subtitle={t("events.subtitle")}
      />
      <OperatorAlertsList
        alerts={alertList}
        locale={locale}
        labels={{
          empty: t("events.empty"),
          taskDone: t("events.taskDone"),
          taskDue: t("events.taskDue"),
          sentToTelegram: t("events.sentToTelegram"),
          webOnly: t("events.webOnly"),
        }}
      />
      <p className="mt-8 border-t border-[var(--border)] pt-4 text-sm text-[var(--text-muted)]">
        <Link
          href={`/${locale}/events/activity`}
          className="font-medium text-brand-accent hover:text-brand-accent-hover"
        >
          {t("events.viewActivity")}
        </Link>
        <span className="mt-1 block text-xs">{t("events.viewActivityHint")}</span>
      </p>
    </>
  );
}
