import { PageHeader } from "@/components/layout/app-shell";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { requireRole } from "@/lib/require-session";
import { ExportDataButton } from "@/components/teammates/export-data-button";
import { teamListStyles } from "@/components/teammates/team-list.styles";
import { viewToggleStyles } from "@/components/tasks/view-toggle/view-toggle.styles";
import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { AccountInactiveIcon } from "@/components/ui/account-inactive-icon";
import { TelegramStatusIcon } from "@/components/ui/telegram-status-icon";
import { memberInactiveLabel } from "@/components/ui/member-status-icons";
import { cn } from "@/lib/cn";
import { groupMemberLabel } from "@/lib/group-member-label";
import { resendGroupInvitation } from "@/app/actions/invitations";

export default async function TeammatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    promoted?: string;
    demoted?: string;
    invited?: string;
    resent?: string;
    invitationError?: string;
  }>;
}) {
  const { locale } = await params;
  const { promoted, demoted, invited, resent, invitationError } = await searchParams;
  const t = await getTranslations();
  const { auth, teammates, invitations } = getServices();
  const session = await auth.getSession();
  if (!session) return null;
  requireRole(session, "operator", locale);

  const [users, groupInvitations] = await Promise.all([
    teammates.listOrganizationUsers({ session }),
    invitations.listForGroup({ session }),
  ]);

  return (
    <>
      <PageHeader title={t("common.teammates")} />
      {promoted === "1" ? (
        <Banner variant="info" className="mb-4">
          {t("teammate.promoted")}
        </Banner>
      ) : null}
      {demoted === "1" ? (
        <Banner variant="info" className="mb-4">
          {t("teammate.demoted")}
        </Banner>
      ) : null}
      {invited === "1" ? (
        <Banner variant="info" className="mb-4">
          {t("teammate.invitationCreated")}
        </Banner>
      ) : null}
      {resent === "1" ? (
        <Banner variant="info" className="mb-4">
          {t("teammate.invitationResent")}
        </Banner>
      ) : null}
      {invitationError === "1" ? (
        <Banner variant="severity" className="mb-4">
          {t("teammate.invitationActionFailed")}
        </Banner>
      ) : null}
      <div className={viewToggleStyles.toolbar}>
        <p className={viewToggleStyles.toolbarText}>{t("teammate.listSubtitle")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <ExportDataButton label={t("teammate.exportAll")} variant="secondary" />
          <Link href={`/${locale}/teammates/new`}>
            <Button>{t("teammate.addTeammate")}</Button>
          </Link>
        </div>
      </div>

      {groupInvitations.length > 0 ? (
        <section className="mb-4 rounded-card border border-[var(--border)] bg-surface-card p-4">
          <h2 className="text-sm font-semibold">{t("teammate.pendingInvitations")}</h2>
          <div className="mt-3 divide-y divide-[var(--border)]">
            {groupInvitations.map((invitation) => (
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
                  <form action={resendGroupInvitation.bind(null, locale, invitation.id)}>
                    <Button type="submit" variant="secondary">
                      {t("teammate.resendInvitation")}
                    </Button>
                  </form>
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
              const detailHref =
                user.id === session.user.id
                  ? `/${locale}/settings`
                  : `/${locale}/teammates/${user.id}`;
              const inactiveLabel = memberInactiveLabel(user, {
                invited: t("teammate.invited"),
                inactive: t("teammate.inactive"),
              });

              return (
                <tr key={user.id} className={teamListStyles.trHover}>
                  <td className={cn(teamListStyles.td, teamListStyles.userCell)}>
                    <Link href={detailHref} className={teamListStyles.nameLink}>
                      {groupMemberLabel(user)}
                    </Link>
                  </td>
                  <td className={teamListStyles.td}>{user.email}</td>
                  <td className={teamListStyles.td}>
                    {t(`roles.${user.role}`)}
                  </td>
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
    </>
  );
}
