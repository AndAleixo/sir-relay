"use client";

import { useEffect, useId, useState, useActionState } from "react";
import { useTranslations } from "next-intl";
import type { GroupInvitation, UserGroup } from "@/domain/types";
import type { GroupFormState } from "@/app/actions/groups";
import {
  createGroupForm,
  redeemInviteForm,
  selectGroup,
} from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { GroupInvitationActions } from "@/components/groups/group-invitation-actions";
import { shellStyles } from "./app-shell.styles";

const emptyFormState: GroupFormState = { error: null };

const errorKeys = {
  short: "nameTooShort",
  invite_invalid: "inviteInvalid",
  email_mismatch: "inviteEmailMismatch",
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
  const [state, action] = useActionState(
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
  const [state, action] = useActionState(
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

interface GroupPanelMenuProps {
  locale: string;
  groups: UserGroup[];
  invitations: GroupInvitation[];
  activeGroupId: string | null;
  returnPath: string;
  panelOpen: boolean;
  showCreate: boolean;
  onShowCreate: (value: boolean) => void;
}

export function GroupPanelMenu({
  locale,
  groups,
  invitations,
  activeGroupId,
  returnPath,
  panelOpen,
  showCreate,
  onShowCreate,
}: GroupPanelMenuProps) {
  const t = useTranslations();
  const [showJoin, setShowJoin] = useState(false);

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

      {invitations.length > 0 ? (
        <div className={shellStyles.groupPanelSection}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {t("groups.pendingInvitations")}
          </p>
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="space-y-2">
                <p className="text-sm font-medium">{invitation.groupName}</p>
                <GroupInvitationActions
                  locale={locale}
                  invitationId={invitation.id}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
    </div>
  );
}
