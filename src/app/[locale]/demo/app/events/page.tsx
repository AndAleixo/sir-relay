"use client";

import { useLocale, useTranslations } from "next-intl";
import { useDemoWorkspace } from "@/components/demo/demo-provider";
import { demoAlerts } from "@/lib/demo-workspace";
import { OperatorAlertsList } from "@/components/alerts/operator-alerts-list";
import { PageHeader } from "@/components/layout/app-shell";

export default function DemoEventsPage() {
  const locale = useLocale();
  const t = useTranslations();
  const workspace = useDemoWorkspace();
  if (!workspace) return null;

  return (
    <>
      <PageHeader title={t("events.title")} subtitle={t("events.subtitle")} />
      <OperatorAlertsList
        alerts={demoAlerts(workspace.tasks)}
        locale={locale}
        linkTasks={false}
        labels={{
          empty: t("events.empty"),
          taskDone: t("events.taskDone"),
          taskDue: t("events.taskDue"),
          sentToTelegram: t("events.sentToTelegram"),
          webOnly: t("events.webOnly"),
          showMore: t("common.showMore"),
        }}
      />
    </>
  );
}
