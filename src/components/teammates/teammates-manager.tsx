"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { resendGroupInvitation } from "@/app/actions/invitations";
import { ExportDataButton } from "@/components/teammates/export-data-button";
import { teamListStyles } from "@/components/teammates/team-list.styles";
import { viewToggleStyles } from "@/components/tasks/view-toggle/view-toggle.styles";
import { ToneBadge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { AccountInactiveIcon } from "@/components/ui/account-inactive-icon";
import { TelegramStatusIcon } from "@/components/ui/telegram-status-icon";
import { memberInactiveLabel } from "@/components/ui/member-status-icons";
import type { GroupInvitation, User } from "@/domain/types";
import { cn } from "@/lib/cn";
import { groupMemberLabel } from "@/lib/group-member-label";

export type TeammatesManagerProps = {
  locale: string;
  currentUserId: string;
  users: User[];
  invitations: GroupInvitation[];
  isOperator: boolean;
  invitationError?: boolean;
  /**
   * Demo: self links here, other names stay text, invite and export stay off.
   */
  profileHref?: string;
  /** Extra toolbar / below-list content (e.g. demo add-member form). */
  children?: ReactNode;
};

export function TeammatesManager({
  locale,
  currentUserId,
  users,
  invitations,
  isOperator,
  invitationError,
  profileHref,
  children,
}: TeammatesManagerProps) {
  const t = useTranslations();
  const localList = Boolean(profileHref);

  return (
    <>
      {invitationError ? (
        <Banner variant="severity" className="mb-4">
          {t("teammate.invitationActionFailed")}
        </Banner>
      ) : null}
      <div className={viewToggleStyles.toolbar}>
        <p className={viewToggleStyles.toolbarText}>{t("teammate.listSubtitle")}</p>
        {isOperator && !localList ? (
          <div className="flex flex-wrap items-center gap-2">
            <ExportDataButton label={t("teammate.exportAll")} variant="secondary" />
            <Link href={`/${locale}/teammates/new`}>
              <Button>{t("teammate.addTeammate")}</Button>
            </Link>
          </div>
        ) : null}
      </div>

      {invitations.length > 0 ? (
        <section className="mb-4 rounded-card border border-[var(--border)] bg-surface-card p-4">
          <h2 className="text-sm font-semibold">{t("teammate.pendingInvitations")}</h2>
          <div className="mt-3 divide-y divide-[var(--border)]">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{invitation.invitedUserName}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {invitation.invitedUserEmail}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ToneBadge
                    tone={invitation.status === "pending" ? "warning" : "neutral"}
                  >
                    {t(`teammate.invitationStatus.${invitation.status}`)}
                  </ToneBadge>
                  {isOperator && !localList ? (
                    <form action={resendGroupInvitation.bind(null, locale, invitation.id)}>
                      <Button type="submit" variant="secondary">
                        {t("teammate.resendInvitation")}
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className={teamListStyles.tableWrap}>
        <table className={teamListStyles.table}>
          <thead>
            <tr>
              <th className={teamListStyles.th}>{t("teammate.name")}</th>
              <th className={teamListStyles.th}>{t("auth.email")}</th>
              <th className={teamListStyles.th}>{t("teammate.roleColumn")}</th>
              <th className={cn(teamListStyles.th, teamListStyles.iconTh)}>
                {t("teammate.accountColumn")}
              </th>
              <th className={cn(teamListStyles.th, teamListStyles.iconTh)}>
                {t("teammate.telegramColumn")}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const detailHref = localList
                ? isSelf
                  ? profileHref
                  : null
                : isSelf
                  ? `/${locale}/settings`
                  : `/${locale}/teammates/${user.id}`;
              const inactiveLabel = memberInactiveLabel(user, {
                invited: t("teammate.invited"),
                inactive: t("teammate.inactive"),
              });
              const label = groupMemberLabel(user);

              return (
                <tr key={user.id} className={teamListStyles.trHover}>
                  <td className={cn(teamListStyles.td, teamListStyles.userCell)}>
                    {detailHref ? (
                      <Link href={detailHref} className={teamListStyles.nameLink}>
                        {label}
                      </Link>
                    ) : (
                      label
                    )}
                  </td>
                  <td className={teamListStyles.td}>{user.email}</td>
                  <td className={teamListStyles.td}>{t(`roles.${user.role}`)}</td>
                  <td className={cn(teamListStyles.td, teamListStyles.iconTd)}>
                    {inactiveLabel ? (
                      <AccountInactiveIcon label={inactiveLabel} />
                    ) : null}
                  </td>
                  <td className={cn(teamListStyles.td, teamListStyles.iconTd)}>
                    {user.telegramStatus ? (
                      <TelegramStatusIcon
                        status={user.telegramStatus}
                        label={
                          user.telegramStatus === "linked"
                            ? t("teammate.linked")
                            : t("teammate.pending")
                        }
                      />
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {children}
    </>
  );
}
