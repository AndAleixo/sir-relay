"use client";

import { useState } from "react";
import Link from "next/link";
import type { OperatorAlert } from "@/domain/types";
import { formatDueDate, formatRelativeTime } from "@/lib/dates";
import { Card, CardBody } from "@/components/ui/card";
import { ToneBadge } from "@/components/ui/badge";
import {
  ALERTS_PREVIEW_INITIAL,
  ALERTS_PREVIEW_STEP,
} from "@/components/alerts/alerts-preview";

interface OperatorAlertsListProps {
  alerts: OperatorAlert[];
  locale: string;
  labels: {
    empty: string;
    taskDone: string;
    taskDue: string;
    sentToTelegram: string;
    webOnly: string;
    showMore: string;
  };
}

export function OperatorAlertsList({
  alerts,
  locale,
  labels,
}: OperatorAlertsListProps) {
  const [visibleCount, setVisibleCount] = useState(ALERTS_PREVIEW_INITIAL);

  if (alerts.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-[var(--text-muted)]">{labels.empty}</p>
        </CardBody>
      </Card>
    );
  }

  const visible = alerts.slice(0, visibleCount);
  const hasMore = visibleCount < alerts.length;

  return (
    <ul className="space-y-2">
      {visible.map((alert) => (
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
      {hasMore ? (
        <li>
          <button
            type="button"
            className="w-full cursor-pointer px-2 py-2 text-center text-xs text-brand-accent-hover hover:underline"
            onClick={() =>
              setVisibleCount((n) => n + ALERTS_PREVIEW_STEP)
            }
          >
            {labels.showMore}
          </button>
        </li>
      ) : null}
    </ul>
  );
}
