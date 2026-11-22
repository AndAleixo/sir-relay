"use client";

import { useState, useTransition } from "react";
import type { UserPlan } from "@/domain/types";
import { updatePlatformUserPlanAction } from "@/app/actions/platform-users";
import { CheckIcon } from "@/components/ui/icons";
import { DEFAULT_PLUS_DAYS, USER_PLANS } from "@/lib/ai-suggest-quota";

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
    <form
      className="flex min-w-[14rem] flex-nowrap items-center gap-2"
      action={(formData) => {
        startTransition(async () => {
          await updatePlatformUserPlanAction(locale, formData);
        });
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <select
        name="plan"
        value={selected}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as UserPlan;
          setSelected(next);
          if (next === "plus" && !expires) setExpires(plusDefaultExpiry());
        }}
        className="shrink-0 rounded-button border border-[var(--border)] bg-surface-card px-2 py-1.5 text-sm text-[var(--text-primary)]"
        aria-label={planLabel(selected)}
      >
        {USER_PLANS.map((value) => (
          <option key={value} value={value}>
            {planLabel(value)}
          </option>
        ))}
      </select>
      {selected === "plus" ? (
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <span className="whitespace-nowrap">{labels.expires}</span>
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
      <button
        type="submit"
        disabled={pending}
        aria-label={labels.save}
        title={labels.save}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-button text-brand-accent transition-colors hover:bg-[var(--surface-bg)] hover:text-brand-accent-hover disabled:opacity-50"
      >
        <CheckIcon className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
