import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { mockSelectGroup } from "@/app/actions/mock-groups";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { resolveEntryPath } from "@/lib/entry-route";
import { requireSession } from "@/lib/require-session";
import { getServices } from "@/services";

export default async function GroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const session = await requireSession(locale);
  const { auth, groups } = getServices();

  if (session.user.mustChangePassword) {
    redirect(`/${locale}/change-password`);
  }

  const groupList = await groups.listForUser(session.user.id);
  if (groupList.length === 1 && !session.activeGroupId) {
    const next = await auth.setActiveGroup(session.user.id, groupList[0].id);
    redirect(resolveEntryPath(locale, next));
  }
  if (session.activeGroupId && groupList.length > 0) {
    const role = await groups.roleInGroup(session.user.id, session.activeGroupId);
    if (role) {
      redirect(resolveEntryPath(locale, session));
    }
  }

  const groupListWithRoles = await Promise.all(
    groupList.map(async (group) => ({
      group,
      role: await groups.roleInGroup(session.user.id, group.id),
    })),
  );

  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className="mx-auto w-full max-w-lg flex-1 py-12">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {t("groups.title")}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{t("groups.subtitle")}</p>
        </div>
        {groupList.length === 0 ? (
          <Card>
            <CardBody className="space-y-4 text-center">
              <p className="text-sm text-[var(--text-muted)]">{t("groups.empty")}</p>
              <Link href={`/${locale}/groups/new`}>
                <Button>{t("groups.create")}</Button>
              </Link>
            </CardBody>
          </Card>
        ) : (
          <ul className="space-y-3">
            {groupListWithRoles.map(({ group, role }) => (
              <li key={group.id}>
                <Card>
                  <CardBody className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{group.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {t(`roles.${role ?? "teammate"}`)}
                      </p>
                    </div>
                    <form action={mockSelectGroup.bind(null, locale, group.id)}>
                      <Button type="submit" variant="secondary">
                        {t("groups.open")}
                      </Button>
                    </form>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
        {groupList.length > 0 ? (
          <div className="mt-6 text-center">
            <Link
              href={`/${locale}/groups/new`}
              className="text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
            >
              {t("groups.createAnother")}
            </Link>
          </div>
        ) : null}
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
