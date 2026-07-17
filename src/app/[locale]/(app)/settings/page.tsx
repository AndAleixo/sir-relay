import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { updateOwnDisplayNameForm } from "@/app/actions/teammates";
import { PageHeader } from "@/components/layout/app-shell";
import { GroupDangerSettings } from "@/components/settings/group-danger-settings";
import { GroupGeneralSettings } from "@/components/settings/group-general-settings";
import { GroupNotificationSettings } from "@/components/settings/group-notification-settings";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { requireAppSession } from "@/lib/require-session";
import { getServices } from "@/services";

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    renameError?: string;
    renamed?: string;
    displayNameSaved?: string;
    displayNameError?: string;
  }>;
}) {
  const { locale } = await params;
  const { renameError, renamed, displayNameSaved, displayNameError } = await searchParams;
  const t = await getTranslations();
  const session = await requireAppSession(locale);
  const { alerts, groups, teammates } = getServices();

  const groupList = await groups.listForUser(session.user.id);
  const activeGroup =
    groupList.find((group) => group.id === session.activeGroupId) ?? null;
  const isOperator = session.user.role === "operator";
  const alertPrefs = isOperator && activeGroup ? await alerts.getPrefs({ session }) : null;

  const members = activeGroup ? await teammates.listOrganizationUsers({ session }) : [];
  const membershipSelf = members.find((user) => user.id === session.user.id);
  const memberCount = activeGroup ? await groups.countMembers(activeGroup.id) : 0;
  let isLastOperator = false;
  if (activeGroup && isOperator) {
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
        {session.user.telegramStatus === "pending" ? (
          <Banner variant="warning">
            {t(
              isOperator ? "settings.linkTelegramOperator" : "settings.linkTelegramTeammate",
            )}{" "}
            <Link
              href={`/${locale}/profile`}
              className="font-medium underline underline-offset-2"
            >
              {t("common.account")}
            </Link>
          </Banner>
        ) : null}

        {activeGroup ? (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">{t("settings.general")}</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <GroupGeneralSettings
                locale={locale}
                group={activeGroup}
                memberCount={memberCount}
                isOperator={isOperator}
                renameError={renameError}
                renamed={renamed === "1"}
              />
              <form
                action={updateOwnDisplayNameForm.bind(null, locale)}
                className="space-y-3 border-t border-[var(--border)] pt-4"
              >
                <div>
                  <Label htmlFor="displayName">{t("teammate.fantasyName")}</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    defaultValue={membershipSelf?.displayName ?? ""}
                    placeholder={t("teammate.fantasyNamePlaceholder")}
                  />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {t("teammate.fantasyNameHint")}
                  </p>
                </div>
                {displayNameSaved === "1" ? (
                  <Banner variant="info">{t("settings.fantasyNameSaved")}</Banner>
                ) : null}
                {displayNameError === "1" ? (
                  <Banner variant="danger">{t("settings.fantasyNameFailed")}</Banner>
                ) : null}
                <Button type="submit" variant="secondary">
                  {t("settings.saveFantasyName")}
                </Button>
              </form>
            </CardBody>
          </Card>
        ) : null}

        {isOperator && alertPrefs ? (
          <>
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
