import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { regenerateInviteForm, updateTeammateForm } from "@/app/actions/teammates";
import { Banner } from "@/components/ui/banner";
import { PageHeader } from "@/components/layout/app-shell";
import { CopyLinkButton } from "@/components/teammates/copy-link-button";
import { DemoteOperatorButton } from "@/components/teammates/demote-operator-button";
import { PromoteTeammateButton } from "@/components/teammates/promote-teammate-button";
import { RemoveTeammateButton } from "@/components/teammates/remove-teammate-button";
import { TransferOwnershipButton } from "@/components/teammates/transfer-ownership-button";
import { ToneBadge } from "@/components/ui/badge";
import { TelegramStatusIcon } from "@/components/ui/telegram-status-icon";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { joinInviteUrl } from "@/lib/app-url";
import { groupMemberLabel } from "@/lib/group-member-label";
import { getServices } from "@/services";
import { requireRole } from "@/lib/require-session";

function isTeammateMember(
  member: { role: string; accountStatus?: string },
): member is { role: "teammate"; accountStatus: "invited" | "active" } {
  return member.role === "teammate";
}

export default async function TeammateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ error?: string; transferred?: string }>;
}) {
  const { locale, id } = await params;
  const { error, transferred } = await searchParams;
  const t = await getTranslations();
  const { teammates, auth, groups } = getServices();
  const session = await auth.getSession();
  if (!session) return null;
  requireRole(session, "operator", locale);

  if (id === session.user.id) {
    redirect(`/${locale}/settings`);
  }

  const member = await teammates.getOrganizationUser(id, { session });
  if (!member) redirect(`/${locale}/teammates`);

  const groupList = await groups.listForUser(session.user.id);
  const activeGroup =
    groupList.find((group) => group.id === session.activeGroupId) ?? null;
  const isOwner = Boolean(
    activeGroup && activeGroup.ownerUserId === session.user.id,
  );
  const memberIsOwner = Boolean(
    activeGroup && activeGroup.ownerUserId === member.id,
  );
  const orgUsers = await teammates.listOrganizationUsers({ session });
  const operatorCount = orgUsers.filter((user) => user.role === "operator").length;
  const canDemote =
    member.role === "operator" && !memberIsOwner && operatorCount > 1;
  const canTransfer =
    isOwner &&
    !memberIsOwner &&
    member.active &&
    (!isTeammateMember(member) || member.accountStatus === "active");

  const label = groupMemberLabel(member);
  const teammate = isTeammateMember(member) ? member : null;
  const inviteToken =
    teammate?.accountStatus === "invited"
      ? await teammates.getInviteToken(id, { session })
      : null;
  const inviteUrl = inviteToken ? await joinInviteUrl(locale, inviteToken) : "";

  return (
    <>
      <PageHeader title={label} />
      {transferred === "1" ? (
        <Banner variant="info" className="mb-4">
          {t("teammate.ownershipTransferred")}
        </Banner>
      ) : null}
      {error === "promote" ? (
        <Banner variant="danger" className="mb-4">
          {t("teammate.promoteFailed")}
        </Banner>
      ) : null}
      {error === "demote" ? (
        <Banner variant="danger" className="mb-4">
          {t("teammate.demoteFailed")}
        </Banner>
      ) : null}
      {error === "transfer" ? (
        <Banner variant="danger" className="mb-4">
          {t("teammate.transferFailed")}
        </Banner>
      ) : null}
      {error === "edit" ? (
        <Banner variant="danger" className="mb-4">
          {t("teammate.editFailed")}
        </Banner>
      ) : null}
      {error === "remove" ? (
        <Banner variant="danger" className="mb-4">
          {t("teammate.removeFailed")}
        </Banner>
      ) : null}
      {error === "invite" ? (
        <Banner variant="danger" className="mb-4">
          {t("teammate.inviteFailed")}
        </Banner>
      ) : null}
      <div className="grid max-w-2xl gap-4">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <ToneBadge tone={member.role === "operator" ? "accent" : "neutral"}>
                {t(`roles.${member.role}`)}
              </ToneBadge>
              {member.telegramStatus ? (
                <TelegramStatusIcon
                  status={member.telegramStatus}
                  label={
                    member.telegramStatus === "linked"
                      ? t("teammate.linked")
                      : t("teammate.pending")
                  }
                />
              ) : null}
              {teammate ? (
                <ToneBadge tone="neutral">
                  {teammate.accountStatus === "active"
                    ? t("teammate.active")
                    : t("teammate.invited")}
                </ToneBadge>
              ) : null}
            </div>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p>
              <span className="text-[var(--text-muted)]">{t("auth.email")}:</span>{" "}
              {member.email}
            </p>
            {member.name.trim() ? (
              <p>
                <span className="text-[var(--text-muted)]">{t("profile.accountName")}:</span>{" "}
                {member.name}
              </p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">{t("teammate.editSection")}</h2>
          </CardHeader>
          <CardBody>
            <form action={updateTeammateForm.bind(null, locale, id)} className="space-y-4">
              <div>
                <Label htmlFor="displayName">{t("teammate.fantasyName")}</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  defaultValue={member.displayName ?? ""}
                  placeholder={t("teammate.fantasyNamePlaceholder")}
                />
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {t("teammate.fantasyNameHint")}
                </p>
              </div>
              {teammate?.accountStatus === "invited" ? (
                <div>
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={member.email}
                    required
                  />
                </div>
              ) : null}
              <Button type="submit">{t("common.save")}</Button>
            </form>
          </CardBody>
        </Card>

        {teammate?.accountStatus === "invited" ? (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">{t("teammate.inviteLink")}</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {inviteUrl ? (
                <>
                  <div className="flex items-start gap-2">
                    <code className="min-w-0 flex-1 break-all rounded-button bg-[var(--surface-bg)] p-2 text-xs">
                      {inviteUrl}
                    </code>
                    <CopyLinkButton
                      text={inviteUrl}
                      label={t("common.copy")}
                      copiedLabel={t("common.copied")}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t("teammate.inviteLinkHint")}
                  </p>
                </>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">
                  {t("teammate.inviteActiveHint")}
                </p>
              )}
              <form action={regenerateInviteForm.bind(null, locale, id)}>
                <Button type="submit" variant="secondary">
                  {t("teammate.regenerateInvite")}
                </Button>
              </form>
            </CardBody>
          </Card>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {teammate?.active && teammate.accountStatus === "active" ? (
            <PromoteTeammateButton
              locale={locale}
              teammateId={id}
              label={t("teammate.promoteToOperator")}
              confirmMessage={t("teammate.promoteConfirm", { name: label })}
            />
          ) : null}
          {canDemote ? (
            <DemoteOperatorButton
              locale={locale}
              memberId={id}
              label={t("teammate.demoteToTeammate")}
              confirmMessage={t("teammate.demoteConfirm", { name: label })}
            />
          ) : null}
          {canTransfer ? (
            <TransferOwnershipButton
              locale={locale}
              memberId={id}
              label={t("teammate.transferOwnership")}
              confirmMessage={t("teammate.transferOwnershipConfirm", { name: label })}
            />
          ) : null}
          {memberIsOwner ? (
            <p className="text-xs text-[var(--text-muted)] sm:basis-full">
              {t("teammate.memberIsOwnerHint")}
            </p>
          ) : (
            <RemoveTeammateButton
              locale={locale}
              teammateId={id}
              label={t("teammate.remove")}
              confirmMessage={t("teammate.removeConfirm")}
            />
          )}
        </div>
      </div>
    </>
  );
}
