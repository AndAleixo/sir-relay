"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { UserGroup } from "@/domain/types";
import type { GroupFormState } from "@/app/actions/groups";
import { deleteGroupForm, leaveGroupForm } from "@/app/actions/groups";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";

const emptyFormState: GroupFormState = { error: null };

const errorKeys = {
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
  isOwner,
  showLeaveSuccessionHint,
}: {
  locale: string;
  group: UserGroup;
  isOwner?: boolean;
  showLeaveSuccessionHint?: boolean;
}) {
  const t = useTranslations();
  const [leaveState, leaveAction] = useActionState(
    leaveGroupForm.bind(null, locale),
    emptyFormState,
  );
  const [deleteState, deleteAction] = useActionState(
    deleteGroupForm.bind(null, locale),
    emptyFormState,
  );
  const errorMessage =
    formErrorMessage(leaveState?.error, t) ??
    formErrorMessage(deleteState?.error, t);

  return (
    <div className="space-y-3">
      {showLeaveSuccessionHint ? (
        <Banner variant="warning">{t("settings.leaveSuccessionHint")}</Banner>
      ) : null}

      {errorMessage ? (
        <p className="rounded-button border border-[var(--severity-soft-hover)] bg-[var(--severity-soft)] px-3 py-2 text-sm text-[var(--severity)]">
          {errorMessage}
        </p>
      ) : null}

      <div className={isOwner ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p className="min-w-0 text-sm text-[var(--text-muted)]">
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

        {isOwner ? (
          <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="min-w-0 text-sm text-[var(--text-muted)]">
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
              <Button type="submit" variant="severity" className="w-full sm:w-auto">
                {t("groups.delete")}
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
