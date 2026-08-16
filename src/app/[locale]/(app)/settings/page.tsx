import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { updateOwnDisplayNameForm } from "@/app/actions/teammates";
import { PageHeader } from "@/components/layout/app-shell";
import { GroupDangerSettings } from "@/components/settings/group-danger-settings";
import { GroupGeneralSettings } from "@/components/settings/group-general-settings";
import { GroupNotificationSettings } from "@/components/settings/group-notification-settings";
import { GroupProjectsSettings } from "@/components/settings/group-projects-settings";
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
    displayNameError?: string;
    projectError?: string;
  }>;
}) {
  const { locale } = await params;
  const { renameError, displayNameError, projectError } = await searchParams;
  const t = await getTranslations();
  const session = await requireAppSession(locale);
  const { alerts, groups, teammates, projects } = getServices();

  const groupList = await groups.listForUser(session.user.id);
  const activeGroup =
    groupList.find((group) => group.id === session.activeGroupId) ?? null;
  const isOperator = session.user.role === "operator";
  const alertPrefs = isOperator && activeGroup ? await alerts.getPrefs({ session }) : null;

  const members = activeGroup ? await teammates.listOrganizationUsers({ session }) : [];
  const membershipSelf = members.find((user) => user.id === session.user.id);
  const memberCount = activeGroup ? await groups.countMembers(activeGroup.id) : 0;
  const isOwner = Boolean(
    activeGroup && activeGroup.ownerUserId === session.user.id,
  );
  const showLeaveSuccessionHint = isOwner && memberCount > 1;
  const groupProjects =
    activeGroup ? await projects.listInGroup({ session }) : [];

  return (
    <>
      <PageHeader
        title={t("settings.title")}
        subtitle={
          activeGroup ? t("settings.pageSubtitle", { group: activeGroup.name }) : undefined
        }
      />
      <div className="grid max-w-3xl gap-3 md:max-w-4xl md:grid-cols-2 md:gap-4">
        {session.user.telegramStatus === "pending" ? (
          <Banner variant="warning" className="md:col-span-2">
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
          <Card className="min-w-0">
            <CardHeader>
              <h2 className="text-sm font-semibold">{t("settings.projects")}</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {t(
                  isOperator
                    ? "settings.projectsHint"
                    : "settings.projectsHintTeammate",
                )}
              </p>
            </CardHeader>
            <CardBody>
              <GroupProjectsSettings
                locale={locale}
                projects={groupProjects}
                isOperator={isOperator}
                error={projectError}
              />
            </CardBody>
          </Card>
        ) : null}

        {activeGroup ? (
          <Card className="min-w-0">
            <CardHeader>
              <h2 className="text-sm font-semibold">{t("settings.general")}</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {t("settings.generalHint")}
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <GroupGeneralSettings
                locale={locale}
                group={activeGroup}
                memberCount={memberCount}
                isOperator={isOperator}
                isOwner={isOwner}
                renameError={renameError}
              />
              <form
                action={updateOwnDisplayNameForm.bind(null, locale)}
                className="space-y-2 border-t border-[var(--border)] pt-3"
              >
                <div>
                  <Label htmlFor="displayName" className="mb-0">
                    {t("teammate.fantasyName")}
                  </Label>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {t("teammate.fantasyNameHint")}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <Input
                    id="displayName"
                    name="displayName"
                    className="min-w-0 flex-1"
                    defaultValue={membershipSelf?.displayName ?? ""}
                    placeholder={t("teammate.fantasyNamePlaceholder")}
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full shrink-0 sm:w-auto"
                  >
                    {t("common.save")}
                  </Button>
                </div>
                {displayNameError === "1" ? (
                  <Banner variant="severity">{t("settings.fantasyNameFailed")}</Banner>
                ) : null}
              </form>
            </CardBody>
          </Card>
        ) : null}

        {isOperator && alertPrefs ? (
          <Card className="min-w-0">
            <CardHeader>
              <h2 className="text-sm font-semibold">{t("settings.notifications")}</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {t("settings.operatorAlertsHint")}
              </p>
            </CardHeader>
            <CardBody>
              <GroupNotificationSettings
                prefs={alertPrefs}
                viewEventsHref={`/${locale}/events`}
              />
            </CardBody>
          </Card>
        ) : (
          <Card className="min-w-0">
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
          <Card className="min-w-0">
            <CardHeader>
              <h2 className="text-sm font-semibold">{t("settings.dangerZone")}</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {t("settings.dangerZoneHint", { group: activeGroup.name })}
              </p>
            </CardHeader>
            <CardBody>
              <GroupDangerSettings
                locale={locale}
                group={activeGroup}
                isOwner={isOwner}
                showLeaveSuccessionHint={showLeaveSuccessionHint}
              />
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}
