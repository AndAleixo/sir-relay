"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import type { UserGroup } from "@/domain/types";
import type { GroupFormState } from "@/app/actions/groups";
import { deleteGroupForm, leaveGroupForm } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";

const emptyFormState: GroupFormState = { error: null };

const errorKeys = {
  last_operator: "lastOperator",
  forbidden: "forbidden",
  not_member: "notMember",
  action_failed: "actionFailed",
} as const;

function formErrorMessage(
  error: string | null | undefined,
  t: ReturnType<typeof useTranslations>,
) {
  if (!error || !(error in errorKeys)) return null;
  return t(`groups.${errorKeys[error as keyof typeof errorKeys]}`);
}

export function GroupDangerSettings({
  locale,
  group,
}: {
  locale: string;
  group: UserGroup;
}) {
  const t = useTranslations();
  const [leaveState, leaveAction] = useFormState(
    leaveGroupForm.bind(null, locale),
    emptyFormState,
  );
  const [deleteState, deleteAction] = useFormState(
    deleteGroupForm.bind(null, locale),
    emptyFormState,
  );
  const errorMessage =
    formErrorMessage(leaveState?.error, t) ??
    formErrorMessage(deleteState?.error, t);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {t("settings.dangerZone", { group: group.name })}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {t("settings.dangerZoneHint", { group: group.name })}
        </p>
      </div>

      {errorMessage ? (
        <p className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            {t("settings.leaveHint", { group: group.name })}
          </p>
          <form
            action={leaveAction}
            className="shrink-0"
            onSubmit={(event) => {
              if (!window.confirm(t("groups.leaveConfirm", { group: group.name }))) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="groupId" value={group.id} />
            <Button type="submit" variant="secondary" className="w-full sm:w-auto">
              {t("groups.leave")}
            </Button>
          </form>
        </div>

        {group.role === "operator" ? (
          <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--text-muted)]">
              {t("settings.deleteHint", { group: group.name })}
            </p>
            <form
              action={deleteAction}
              className="shrink-0"
              onSubmit={(event) => {
                if (
                  !window.confirm(t("groups.deleteConfirm", { group: group.name }))
                ) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="groupId" value={group.id} />
              <Button type="submit" variant="danger" className="w-full sm:w-auto">
                {t("groups.delete")}
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
