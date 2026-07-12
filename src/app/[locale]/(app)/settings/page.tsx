import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { GroupDangerSettings } from "@/components/settings/group-danger-settings";
import { GroupGeneralSettings } from "@/components/settings/group-general-settings";
import { GroupNotificationSettings } from "@/components/settings/group-notification-settings";
import { Banner } from "@/components/ui/banner";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireAppSession } from "@/lib/require-session";
import { getServices } from "@/services";

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ renameError?: string; renamed?: string }>;
}) {
  const { locale } = await params;
  const { renameError, renamed } = await searchParams;
  const t = await getTranslations();
  const session = await requireAppSession(locale);
  const { alerts, groups, teammates } = getServices();

  const groupList = await groups.listForUser(session.user.id);
  const activeGroup =
    groupList.find((group) => group.id === session.activeGroupId) ?? null;
  const isOperator = session.user.role === "operator";
  const alertPrefs = isOperator && activeGroup ? await alerts.getPrefs({ session }) : null;

  const memberCount = activeGroup ? await groups.countMembers(activeGroup.id) : 0;
  let isLastOperator = false;
  if (activeGroup && isOperator) {
    const members = await teammates.listOrganizationUsers({ session });
    const operators = members.filter((user) => user.role === "operator");
    isLastOperator = operators.length === 1 && members.length > 1;
  }

  return (
    <>
      <PageHeader
        title={t("settings.title")}
        subtitle={
          activeGroup ? t("settings.pageSubtitle", { group: activeGroup.name }) : undefined
        }
      />
      <div className="grid max-w-xl gap-4">
        {activeGroup ? (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">{t("settings.general")}</h2>
            </CardHeader>
            <CardBody>
              <GroupGeneralSettings
                locale={locale}
                group={activeGroup}
                memberCount={memberCount}
                isOperator={isOperator}
                renameError={renameError}
                renamed={renamed === "1"}
              />
            </CardBody>
          </Card>
        ) : null}

        {isOperator && alertPrefs ? (
          <>
            {session.user.telegramStatus === "pending" ? (
              <Banner variant="warning">
                {t("settings.linkTelegram")}{" "}
                <Link
                  href={`/${locale}/profile`}
                  className="font-medium underline underline-offset-2"
                >
                  {t("common.account")}
                </Link>
              </Banner>
            ) : null}
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold">{t("settings.notifications")}</h2>
              </CardHeader>
              <CardBody>
                <GroupNotificationSettings
                  prefs={alertPrefs}
                  viewAlertsHref={`/${locale}/alerts`}
                />
              </CardBody>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">{t("settings.notifications")}</h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-[var(--text-muted)]">
                {t("settings.teammateNotificationsHint")}
              </p>
            </CardBody>
          </Card>
        )}

        {activeGroup ? (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">{t("settings.membership")}</h2>
            </CardHeader>
            <CardBody>
              <GroupDangerSettings
                locale={locale}
                group={activeGroup}
                isLastOperator={isLastOperator}
              />
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}
