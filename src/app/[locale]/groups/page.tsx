import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  mockRedeemInviteLink,
  mockSelectGroup,
} from "@/app/actions/mock-groups";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { ToneBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { resolveEntryPath } from "@/lib/entry-route";
import { requireSession } from "@/lib/require-session";
import { getServices } from "@/services";

const errorKeys = {
  invalid: "invalid",
  invite_invalid: "inviteInvalid",
} as const;

export default async function GroupsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations();
  const session = await requireSession(locale);
  const { groups } = getServices();

  if (session.user.mustChangePassword) {
    redirect(`/${locale}/change-password`);
  }

  const groupList = await groups.listForUser(session.user.id);
  if (groupList.length === 1 && !session.activeGroupId) {
    redirect(`/${locale}/groups/auto`);
  }

  const groupListWithRoles = await Promise.all(
    groupList.map(async (group) => ({
      group,
      role: await groups.roleInGroup(session.user.id, group.id),
    })),
  );

  const activeGroup =
    session.activeGroupId != null
      ? groupList.find((group) => group.id === session.activeGroupId) ?? null
      : null;

  const errorKey =
    error && error in errorKeys ? errorKeys[error as keyof typeof errorKeys] : null;

  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className="mx-auto w-full max-w-lg flex-1 py-12">
        {activeGroup ? (
          <p className="mb-4 text-center">
            <Link
              href={resolveEntryPath(locale, session)}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ← {t("groups.backToApp")}
            </Link>
          </p>
        ) : null}

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {t("groups.title")}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{t("groups.subtitle")}</p>
        </div>

        {errorKey ? (
          <p className="mb-4 rounded-button border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {t(`groups.${errorKey}`)}
          </p>
        ) : null}

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
            {groupListWithRoles.map(({ group, role }) => {
              const isCurrent = session.activeGroupId === group.id;
              return (
                <li key={group.id}>
                  <Card>
                    <CardBody className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{group.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {t(`roles.${role ?? "teammate"}`)}
                        </p>
                      </div>
                      {isCurrent ? (
                        <ToneBadge tone="neutral">{t("groups.current")}</ToneBadge>
                      ) : (
                        <form action={mockSelectGroup.bind(null, locale, group.id)}>
                          <Button type="submit" variant="secondary">
                            {t("groups.open")}
                          </Button>
                        </form>
                      )}
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 space-y-4">
          <div className="text-center">
            <Link href={`/${locale}/groups/new`}>
              <Button variant="secondary">{t("groups.create")}</Button>
            </Link>
          </div>

          <Card>
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {t("groups.joinTitle")}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {t("groups.joinHint")}
                </p>
              </div>
              <form action={mockRedeemInviteLink.bind(null, locale)} className="space-y-3">
                <div>
                  <Label htmlFor="invite">{t("groups.joinLabel")}</Label>
                  <Input
                    id="invite"
                    name="invite"
                    required
                    placeholder={t("groups.joinPlaceholder")}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {t("groups.joinSubmit")}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
