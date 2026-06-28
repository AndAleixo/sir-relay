import Link from "next/link";
import type { OperatorAlert } from "@/domain/types";
import { formatDueDate, formatRelativeTime } from "@/lib/dates";
import { Card, CardBody } from "@/components/ui/card";
import { ToneBadge } from "@/components/ui/badge";

interface OperatorAlertsListProps {
  alerts: OperatorAlert[];
  locale: string;
  labels: {
    empty: string;
    taskDone: string;
    taskDue: string;
    sentToTelegram: string;
    webOnly: string;
  };
}

export function OperatorAlertsList({ alerts, locale, labels }: OperatorAlertsListProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-[var(--text-muted)]">{labels.empty}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert) => (
        <li
          key={alert.id}
          className="rounded-[var(--radius-card)] border border-[var(--border)] bg-surface-card px-4 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[var(--text-primary)]">
                {alert.type === "task_done" ? labels.taskDone : labels.taskDue}{" "}
                <Link
                  href={`/${locale}/tasks/${alert.taskId}`}
                  className="font-medium text-brand-accent hover:text-brand-accent-hover"
                >
                  {alert.taskTitle}
                </Link>
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {alert.assigneeName}
                {alert.dueDate ? ` · ${formatDueDate(alert.dueDate, locale)}` : null} ·{" "}
                {formatRelativeTime(alert.createdAt, locale)}
              </p>
            </div>
            <ToneBadge tone={alert.sentToTelegram ? "success" : "neutral"}>
              {alert.sentToTelegram ? labels.sentToTelegram : labels.webOnly}
            </ToneBadge>
          </div>
        </li>
      ))}
    </ul>
  );
}
