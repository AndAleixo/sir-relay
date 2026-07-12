"use client";

import { useEffect, useId, useState } from "react";
import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import type { UserGroup } from "@/domain/types";
import type { GroupFormState } from "@/app/actions/groups";
import {
  createGroupForm,
  deleteGroupForm,
  leaveGroupForm,
  redeemInviteForm,
  selectGroup,
} from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { shellStyles } from "./app-shell.styles";

const emptyFormState: GroupFormState = { error: null };

const errorKeys = {
  short: "nameTooShort",
  invite_invalid: "inviteInvalid",
  email_mismatch: "inviteEmailMismatch",
  last_operator: "lastOperator",
  forbidden: "forbidden",
  not_member: "notMember",
  action_failed: "actionFailed",
} as const;

function formErrorMessage(error: string | null | undefined, t: ReturnType<typeof useTranslations>) {
  if (!error || !(error in errorKeys)) return null;
  return t(`groups.${errorKeys[error as keyof typeof errorKeys]}`);
}

function GroupPanelCreateForm({
  locale,
  onCancel,
}: {
  locale: string;
  onCancel: () => void;
}) {
  const t = useTranslations();
  const nameId = useId();
  const [state, action] = useFormState(
    createGroupForm.bind(null, locale),
    emptyFormState,
  );
  const errorMessage = formErrorMessage(state?.error, t);

  return (
    <form action={action} className={shellStyles.groupPanelForm}>
      {errorMessage ? (
        <p className={shellStyles.groupPanelError}>{errorMessage}</p>
      ) : null}
      <Label htmlFor={nameId} className={shellStyles.groupPanelLabel}>
        {t("groups.name")}
      </Label>
      <Input
        id={nameId}
        name="name"
        required
        minLength={2}
        autoFocus
        placeholder={t("groups.namePlaceholder")}
      />
      <div className={shellStyles.groupPanelActions}>
        <Button type="submit" className="min-h-11 flex-1 touch-manipulation">
          {t("groups.create")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 touch-manipulation"
          onClick={onCancel}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}

function GroupPanelJoinForm({
  locale,
  onCancel,
  onError,
}: {
  locale: string;
  onCancel: () => void;
  onError: () => void;
}) {
  const t = useTranslations();
  const inviteId = useId();
  const [state, action] = useFormState(
    redeemInviteForm.bind(null, locale),
    emptyFormState,
  );
  const errorMessage = formErrorMessage(state?.error, t);

  useEffect(() => {
    if (state?.error) {
      onError();
    }
  }, [state?.error, onError]);

  async function pasteInvite() {
    try {
      const text = await navigator.clipboard.readText();
      const el = document.getElementById(inviteId) as HTMLInputElement | null;
      if (el) el.value = text.trim();
    } catch {
      /* clipboard denied */
    }
    document.getElementById(inviteId)?.focus();
  }

  return (
    <form action={action} className={shellStyles.groupPanelForm}>
      {errorMessage ? (
        <p className={shellStyles.groupPanelError}>{errorMessage}</p>
      ) : null}
      <p className={shellStyles.groupPanelHint}>{t("groups.joinHint")}</p>
      <Label htmlFor={inviteId} className={shellStyles.groupPanelLabel}>
        {t("groups.joinLabel")}
      </Label>
      <div className={shellStyles.groupPanelJoinRow}>
        <Input
          id={inviteId}
          name="invite"
          required
          placeholder={t("groups.joinPlaceholder")}
          autoFocus
        />
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 touch-manipulation"
          onClick={() => void pasteInvite()}
        >
          {t("shell.pasteInvite")}
        </Button>
      </div>
      <div className={shellStyles.groupPanelActions}>
        <Button type="submit" className="min-h-11 flex-1 touch-manipulation">
          {t("groups.joinSubmit")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 touch-manipulation"
          onClick={onCancel}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}

function GroupPanelDangerSection({
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
    formErrorMessage(leaveState?.error, t) ?? formErrorMessage(deleteState?.error, t);

  return (
    <div className={shellStyles.groupPanelSection}>
      {errorMessage ? (
        <p className={cn(shellStyles.groupPanelError, "mx-0 mt-0")}>{errorMessage}</p>
      ) : null}
      <form
        action={leaveAction}
        onSubmit={(event) => {
          if (!window.confirm(t("groups.leaveConfirm", { group: group.name }))) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="groupId" value={group.id} />
        <button type="submit" className={shellStyles.groupPanelDangerAction}>
          {t("groups.leave")}
        </button>
      </form>
      {group.role === "operator" ? (
        <form
          action={deleteAction}
          className="mt-1"
          onSubmit={(event) => {
            if (!window.confirm(t("groups.deleteConfirm", { group: group.name }))) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="groupId" value={group.id} />
          <button type="submit" className={shellStyles.groupPanelDangerAction}>
            {t("groups.delete")}
          </button>
        </form>
      ) : null}
    </div>
  );
}

interface GroupPanelMenuProps {
  locale: string;
  groups: UserGroup[];
  activeGroupId: string | null;
  returnPath: string;
  panelOpen: boolean;
  showCreate: boolean;
  onShowCreate: (value: boolean) => void;
}

export function GroupPanelMenu({
  locale,
  groups,
  activeGroupId,
  returnPath,
  panelOpen,
  showCreate,
  onShowCreate,
}: GroupPanelMenuProps) {
  const t = useTranslations();
  const [showJoin, setShowJoin] = useState(false);
  const activeGroup =
    activeGroupId != null
      ? (groups.find((group) => group.id === activeGroupId) ?? null)
      : null;

  useEffect(() => {
    if (!panelOpen) {
      setShowJoin(false);
    }
  }, [panelOpen]);

  function openCreate() {
    onShowCreate(true);
    setShowJoin(false);
  }

  function openJoin() {
    setShowJoin(true);
    onShowCreate(false);
  }

  return (
    <div className={shellStyles.groupPanelBody}>
      {groups.length === 0 ? (
        <p className={shellStyles.groupPanelEmpty}>{t("groups.empty")}</p>
      ) : (
        <ul className="py-1">
          {groups.map((group) => (
            <li key={group.id}>
              {group.id === activeGroupId ? (
                <div
                  className={cn(
                    shellStyles.groupSwitcherItem,
                    shellStyles.groupSwitcherItemActive,
                  )}
                  role="menuitem"
                  aria-current="true"
                >
                  <span className="truncate font-medium">{group.name}</span>
                  <span className={shellStyles.groupSwitcherItemRole}>
                    {t(`roles.${group.role}`)}
                  </span>
                </div>
              ) : (
                <form action={selectGroup.bind(null, locale, group.id, returnPath)}>
                  <button
                    type="submit"
                    className={shellStyles.groupSwitcherItem}
                    role="menuitem"
                  >
                    <span className="truncate">{group.name}</span>
                    <span className={shellStyles.groupSwitcherItemRole}>
                      {t(`roles.${group.role}`)}
                    </span>
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className={shellStyles.groupPanelSection}>
        {showCreate ? (
          <GroupPanelCreateForm locale={locale} onCancel={() => onShowCreate(false)} />
        ) : (
          <button
            type="button"
            className={shellStyles.groupPanelAction}
            onClick={openCreate}
          >
            {t("groups.create")}
          </button>
        )}
      </div>

      <div className={shellStyles.groupPanelSection}>
        {showJoin ? (
          <GroupPanelJoinForm
            locale={locale}
            onCancel={() => setShowJoin(false)}
            onError={() => setShowJoin(true)}
          />
        ) : (
          <button
            type="button"
            className={shellStyles.groupPanelAction}
            onClick={openJoin}
          >
            {t("groups.joinTitle")}
          </button>
        )}
      </div>

      {activeGroup ? (
        <GroupPanelDangerSection locale={locale} group={activeGroup} />
      ) : null}
    </div>
  );
}
