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
        <Banner variant="severity">{errorMessage}</Banner>
      ) : null}

      <div>
        <p className="text-sm text-[var(--text-primary)]">{t("groups.leave")}</p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          {t("settings.leaveHint", { group: group.name })}
        </p>
        <form
          action={leaveAction}
          className="mt-2"
          onSubmit={(event) => {
            if (!window.confirm(t("groups.leaveConfirm", { group: group.name }))) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="groupId" value={group.id} />
          <Button type="submit" variant="secondary">
            {t("groups.leave")}
          </Button>
        </form>
      </div>

      {isOwner ? (
        <div className="border-t border-[var(--border)] pt-3">
          <p className="text-sm text-[var(--text-primary)]">{t("groups.delete")}</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {t("settings.deleteHint", { group: group.name })}
          </p>
          <form
            action={deleteAction}
            className="mt-2"
            onSubmit={(event) => {
              if (!window.confirm(t("groups.deleteConfirm", { group: group.name }))) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="groupId" value={group.id} />
            <Button type="submit" variant="severity">
              {t("groups.delete")}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
