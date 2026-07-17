import { PageHeader } from "@/components/layout/app-shell";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { OrganizationUser } from "@/services/contracts";
import { getServices } from "@/services";
import { requireRole } from "@/lib/require-session";
import { ExportDataButton } from "@/components/teammates/export-data-button";
import { teamListStyles } from "@/components/teammates/team-list.styles";
import { viewToggleStyles } from "@/components/tasks/view-toggle/view-toggle.styles";
import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { cn } from "@/lib/cn";
import { groupMemberLabel } from "@/lib/group-member-label";
import { resendGroupInvitation } from "@/app/actions/invitations";

function isTeammate(user: OrganizationUser): user is OrganizationUser & { role: "teammate" } {
  return user.role === "teammate";
}

export default async function TeammatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    promoted?: string;
    invited?: string;
    resent?: string;
    invitationError?: string;
  }>;
}) {
  const { locale } = await params;
  const { promoted, invited, resent, invitationError } = await searchParams;
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
        <Banner variant="danger" className="mb-4">
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
      <p className="mb-1 text-sm text-[var(--text-muted)]">
        {t("teammate.userCount", { count: users.length })}
      </p>
      <p className="mb-4 text-xs text-[var(--text-muted)]">{t("teammate.exportHint")}</p>

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
              <th className={teamListStyles.th}>{t("teammate.accountColumn")}</th>
              <th className={teamListStyles.th}>{t("teammate.telegramColumn")}</th>
              <th className={teamListStyles.th} />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const detailHref = isTeammate(user)
                ? `/${locale}/teammates/${user.id}`
                : `/${locale}/profile`;

              return (
                <tr key={user.id} className={teamListStyles.trHover}>
                  <td className={cn(teamListStyles.td, teamListStyles.userCell)}>
                    {groupMemberLabel(user)}
                  </td>
                  <td className={teamListStyles.td}>{user.email}</td>
                  <td className={teamListStyles.td}>
                    <ToneBadge tone={user.role === "operator" ? "accent" : "neutral"}>
                      {t(`roles.${user.role}`)}
                    </ToneBadge>
                  </td>
                  <td className={teamListStyles.td}>
                    {isTeammate(user) ? (
                      <ToneBadge tone="neutral">
                        {user.accountStatus === "active"
                          ? t("teammate.active")
                          : t("teammate.invited")}
                      </ToneBadge>
                    ) : (
                      <span className={teamListStyles.muted}>—</span>
                    )}
                  </td>
                  <td className={teamListStyles.td}>
                    {isTeammate(user) ? (
                      <ToneBadge tone={user.telegramStatus === "linked" ? "success" : "warning"}>
                        {user.telegramStatus === "linked"
                          ? t("teammate.linked")
                          : t("teammate.pending")}
                      </ToneBadge>
                    ) : (
                      <span className={teamListStyles.muted}>—</span>
                    )}
                  </td>
                  <td className={teamListStyles.td}>
                    <div className="flex items-center gap-3">
                      <ExportDataButton
                        userId={user.id}
                        label={t("teammate.export")}
                        variant="link"
                      />
                      <Link
                        href={detailHref}
                        className="text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
                      >
                        {t("teammate.viewUser")}
                      </Link>
                    </div>
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
