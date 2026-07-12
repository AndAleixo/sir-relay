"use client";

import Link from "next/link";
import { useTransition } from "react";
import { updateOperatorAlertPrefs } from "@/app/actions/tasks";

interface OperatorAlertSettingsProps {
  taskDone: boolean;
  taskDue: boolean;
  viewAlertsHref?: string;
  labels: {
    taskDone: string;
    taskDoneHint: string;
    taskDue: string;
    taskDueHint: string;
    operatorSection: string;
    operatorSectionHint: string;
    viewAlertHistory: string;
  };
}

export function OperatorAlertSettings({
  taskDone,
  taskDue,
  viewAlertsHref,
  labels,
}: OperatorAlertSettingsProps) {
  const [pending, startTransition] = useTransition();

  function submitPrefs(nextTaskDone: boolean, nextTaskDue: boolean) {
    const formData = new FormData();
    if (nextTaskDone) formData.set("taskDone", "on");
    if (nextTaskDue) formData.set("taskDue", "on");
    startTransition(() => updateOperatorAlertPrefs(formData));
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {labels.operatorSection}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{labels.operatorSectionHint}</p>
      </div>
      <label className="flex items-start justify-between gap-4 text-sm">
        <span>
          <span className="block text-[var(--text-primary)]">{labels.taskDone}</span>
          <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{labels.taskDoneHint}</span>
        </span>
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded"
          checked={taskDone}
          disabled={pending}
          onChange={(event) => submitPrefs(event.target.checked, taskDue)}
        />
      </label>
      <label className="flex items-start justify-between gap-4 text-sm">
        <span>
          <span className="block text-[var(--text-primary)]">{labels.taskDue}</span>
          <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{labels.taskDueHint}</span>
        </span>
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded"
          checked={taskDue}
          disabled={pending}
          onChange={(event) => submitPrefs(taskDone, event.target.checked)}
        />
      </label>
      {viewAlertsHref ? (
        <Link
          href={viewAlertsHref}
          className="inline-block text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
        >
          {labels.viewAlertHistory}
        </Link>
      ) : null}
    </div>
  );
}
