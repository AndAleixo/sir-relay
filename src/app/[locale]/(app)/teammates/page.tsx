import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { OrganizationUser } from "@/services/contracts";
import { getServices } from "@/services";
import { requireRole } from "@/lib/auth-guards";
import { teamListStyles } from "@/components/teammates/team-list.styles";
import { viewToggleStyles } from "@/components/tasks/view-toggle/view-toggle.styles";
import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

function isTeammate(user: OrganizationUser): user is OrganizationUser & { role: "teammate" } {
  return user.role === "teammate";
}

export default async function TeammatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const { auth, teammates } = getServices();
  const session = await auth.getSession();
  if (!session) return null;
  requireRole(session, "operator", locale);

  const users = await teammates.listOrganizationUsers();

  return (
    <>
      <div className={viewToggleStyles.toolbar}>
        <p className={viewToggleStyles.toolbarText}>{t("teammate.listSubtitle")}</p>
        <Link href={`/${locale}/teammates/new`}>
          <Button>{t("teammate.addTeammate")}</Button>
        </Link>
      </div>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        {t("teammate.userCount", { count: users.length })}
      </p>

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
                  <td className={cn(teamListStyles.td, teamListStyles.userCell)}>{user.name}</td>
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
                    <Link
                      href={detailHref}
                      className="text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
                    >
                      {t("teammate.viewUser")}
                    </Link>
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
