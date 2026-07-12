"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateOperatorAlertPrefs } from "@/app/actions/tasks";
import { groupTimezones } from "@/lib/group-timezones";
import type { OperatorAlertPrefs } from "@/services/alert.types";
import { Label, Select } from "@/components/ui/input";

interface GroupNotificationSettingsProps {
  prefs: OperatorAlertPrefs;
  viewAlertsHref?: string;
}

export function GroupNotificationSettings({
  prefs,
  viewAlertsHref,
}: GroupNotificationSettingsProps) {
  const t = useTranslations("settings");
  const [pending, startTransition] = useTransition();
  const quietEnabled =
    prefs.quietHoursStart != null && prefs.quietHoursEnd != null;

  function submit(formData: FormData) {
    startTransition(() => updateOperatorAlertPrefs(formData));
  }

  function submitToggles(nextTaskDone: boolean, nextTaskDue: boolean) {
    const formData = new FormData();
    if (nextTaskDone) formData.set("taskDone", "on");
    if (nextTaskDue) formData.set("taskDue", "on");
    submit(formData);
  }

  function timezoneLabel(zone: (typeof groupTimezones)[number]) {
    const keys: Record<(typeof groupTimezones)[number], string> = {
      UTC: "timezoneUtc",
      "Europe/London": "timezoneEuropeLondon",
      "Europe/Lisbon": "timezoneEuropeLisbon",
      "Europe/Madrid": "timezoneEuropeMadrid",
      "America/Sao_Paulo": "timezoneAmericaSaoPaulo",
    };
    return t(keys[zone]);
  }

  function formatHour(hour: number) {
    return t("quietHour", { hour: String(hour).padStart(2, "0") });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {t("operatorAlerts")}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{t("operatorAlertsHint")}</p>
      </div>

      <label className="flex items-start justify-between gap-4 text-sm">
        <span>
          <span className="block text-[var(--text-primary)]">{t("alertTaskDone")}</span>
          <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
            {t("alertTaskDoneHint")}
          </span>
        </span>
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded"
          checked={prefs.taskDone}
          disabled={pending}
          onChange={(event) => submitToggles(event.target.checked, prefs.taskDue)}
        />
      </label>

      <label className="flex items-start justify-between gap-4 text-sm">
        <span>
          <span className="block text-[var(--text-primary)]">{t("alertTaskDue")}</span>
          <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
            {t("alertTaskDueHint")}
          </span>
        </span>
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded"
          checked={prefs.taskDue}
          disabled={pending}
          onChange={(event) => submitToggles(prefs.taskDone, event.target.checked)}
        />
      </label>

      <div className="space-y-2 border-t border-[var(--border)] pt-4">
        <Label htmlFor="alert-timezone">{t("alertTimezone")}</Label>
        <Select
          id="alert-timezone"
          name="timezone"
          defaultValue={prefs.timezone}
          disabled={pending}
          onChange={(event) => {
            const formData = new FormData();
            formData.set("timezone", event.target.value);
            submit(formData);
          }}
        >
          {groupTimezones.map((zone) => (
            <option key={zone} value={zone}>
              {timezoneLabel(zone)}
            </option>
          ))}
        </Select>
        <p className="text-xs text-[var(--text-muted)]">{t("alertTimezoneHint")}</p>
      </div>

      <div className="space-y-3 border-t border-[var(--border)] pt-4">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{t("quietHours")}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{t("quietHoursHint")}</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={quietEnabled}
            disabled={pending}
            onChange={(event) => {
              const formData = new FormData();
              if (event.target.checked) {
                formData.set("quietHoursEnabled", "on");
                formData.set("quietHoursStart", String(prefs.quietHoursStart ?? 22));
                formData.set("quietHoursEnd", String(prefs.quietHoursEnd ?? 8));
              } else {
                formData.set("quietHoursEnabled", "off");
              }
              submit(formData);
            }}
          />
          {t("quietHoursEnabled")}
        </label>
        {quietEnabled ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="quiet-start">{t("quietFrom")}</Label>
              <Select
                id="quiet-start"
                defaultValue={String(prefs.quietHoursStart ?? 22)}
                disabled={pending}
                onChange={(event) => {
                  const formData = new FormData();
                  formData.set("quietHoursEnabled", "on");
                  formData.set("quietHoursStart", event.target.value);
                  formData.set("quietHoursEnd", String(prefs.quietHoursEnd ?? 8));
                  submit(formData);
                }}
              >
                {hourOptions(formatHour)}
              </Select>
            </div>
            <div>
              <Label htmlFor="quiet-end">{t("quietTo")}</Label>
              <Select
                id="quiet-end"
                defaultValue={String(prefs.quietHoursEnd ?? 8)}
                disabled={pending}
                onChange={(event) => {
                  const formData = new FormData();
                  formData.set("quietHoursEnabled", "on");
                  formData.set("quietHoursStart", String(prefs.quietHoursStart ?? 22));
                  formData.set("quietHoursEnd", event.target.value);
                  submit(formData);
                }}
              >
                {hourOptions(formatHour)}
              </Select>
            </div>
          </div>
        ) : null}
      </div>

      {viewAlertsHref ? (
        <Link
          href={viewAlertsHref}
          className="inline-block text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
        >
          {t("viewAlertHistory")}
        </Link>
      ) : null}
    </div>
  );
}

function hourOptions(label: (hour: number) => string) {
  return Array.from({ length: 24 }, (_, hour) => (
    <option key={hour} value={hour}>
      {label(hour)}
    </option>
  ));
}
