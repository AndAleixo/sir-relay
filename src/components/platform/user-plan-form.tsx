"use client";

import { useState, useTransition } from "react";
import type { UserPlan } from "@/domain/types";
import {
  extendPlatformUserPlanAction,
  updatePlatformUserPlanAction,
} from "@/app/actions/platform-users";
import {
  DEFAULT_PLUS_DAYS,
  PLAN_EXTEND_PRESETS_DAYS,
  USER_PLANS,
} from "@/lib/ai-suggest-quota";

type UserPlanFormProps = {
  locale: string;
  userId: string;
  plan: UserPlan;
  planExpiresAt: string | null;
  labels: {
    basic: string;
    plus: string;
    save: string;
    expires: string;
    extend: string;
    days30: string;
    days90: string;
    days365: string;
  };
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function plusDefaultExpiry(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + DEFAULT_PLUS_DAYS);
  return d.toISOString().slice(0, 10);
}

const EXTEND_LABEL: Record<(typeof PLAN_EXTEND_PRESETS_DAYS)[number], keyof UserPlanFormProps["labels"]> = {
  30: "days30",
  90: "days90",
  365: "days365",
};

export function UserPlanForm({
  locale,
  userId,
  plan,
  planExpiresAt,
  labels,
}: UserPlanFormProps) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<UserPlan>(plan);
  const [expires, setExpires] = useState(
    () => toDateInputValue(planExpiresAt) || plusDefaultExpiry(),
  );
  const planLabel = (value: UserPlan) =>
    value === "plus" ? labels.plus : labels.basic;

  return (
    <div className="flex min-w-[14rem] flex-col gap-1.5">
      <form
        className="flex flex-col gap-1.5"
        action={(formData) => {
          startTransition(async () => {
            await updatePlatformUserPlanAction(locale, formData);
          });
        }}
      >
        <input type="hidden" name="userId" value={userId} />
        <div className="flex flex-wrap items-center gap-2">
          <select
            name="plan"
            value={selected}
            disabled={pending}
            onChange={(event) => {
              const next = event.target.value as UserPlan;
              setSelected(next);
              if (next === "plus" && !expires) setExpires(plusDefaultExpiry());
            }}
            className="rounded-button border border-[var(--border)] bg-surface-card px-2 py-1.5 text-sm text-[var(--text-primary)]"
            aria-label={planLabel(selected)}
          >
            {USER_PLANS.map((value) => (
              <option key={value} value={value}>
                {planLabel(value)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="text-xs font-medium text-brand-accent hover:text-brand-accent-hover disabled:opacity-50"
          >
            {labels.save}
          </button>
        </div>
        {selected === "plus" ? (
          <label className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>{labels.expires}</span>
            <input
              type="date"
              name="planExpiresAt"
              value={expires}
              required
              disabled={pending}
              onChange={(event) => setExpires(event.target.value)}
              className="rounded-button border border-[var(--border)] bg-surface-card px-2 py-1 text-xs text-[var(--text-primary)]"
            />
          </label>
        ) : null}
      </form>

      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
        <span>{labels.extend}</span>
        {PLAN_EXTEND_PRESETS_DAYS.map((days) => (
          <form
            key={days}
            action={(formData) => {
              startTransition(async () => {
                await extendPlatformUserPlanAction(locale, formData);
              });
            }}
          >
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="days" value={days} />
            <button
              type="submit"
              disabled={pending}
              className="underline-offset-2 hover:underline disabled:opacity-50"
            >
              {labels[EXTEND_LABEL[days]]}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
