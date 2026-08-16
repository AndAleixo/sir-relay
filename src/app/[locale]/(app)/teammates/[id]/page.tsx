import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { regenerateInviteForm, updateTeammateForm } from "@/app/actions/teammates";
import { Banner } from "@/components/ui/banner";
import { PageHeader } from "@/components/layout/app-shell";
import { CopyLinkButton } from "@/components/teammates/copy-link-button";
import { DemoteOperatorButton } from "@/components/teammates/demote-operator-button";
import { ExportDataButton } from "@/components/teammates/export-data-button";
import { PromoteTeammateButton } from "@/components/teammates/promote-teammate-button";
import { RemoveTeammateButton } from "@/components/teammates/remove-teammate-button";
import { TransferOwnershipButton } from "@/components/teammates/transfer-ownership-button";
import {
  MemberStatusIcons,
  memberInactiveLabel,
} from "@/components/ui/member-status-icons";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { joinInviteUrl } from "@/lib/app-url";
import { groupMemberLabel } from "@/lib/group-member-label";
import { getServices } from "@/services";
import { requireAppSession } from "@/lib/require-session";

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
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale, id } = await params;
  const { error } = await searchParams;
  const t = await getTranslations();
  const session = await requireAppSession(locale);
  const isOperator = session.user.role === "operator";
  const { teammates, groups } = getServices();

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
  const orgUsers = isOperator
    ? await teammates.listOrganizationUsers({ session })
    : [];
  const operatorCount = orgUsers.filter((user) => user.role === "operator").length;
  const canDemote =
    isOperator &&
    member.role === "operator" &&
    !memberIsOwner &&
    operatorCount > 1;
  const canTransfer =
    isOperator &&
    isOwner &&
    !memberIsOwner &&
    member.active &&
    (!isTeammateMember(member) || member.accountStatus === "active");

  const label = groupMemberLabel(member);
  const teammate = isTeammateMember(member) ? member : null;
  const inviteToken =
    isOperator && teammate?.accountStatus === "invited"
      ? await teammates.getInviteToken(id, { session })
      : null;
  const inviteUrl = inviteToken ? await joinInviteUrl(locale, inviteToken) : "";

  return (
    <>
      <PageHeader
        title={label}
        action={
          <MemberStatusIcons
            telegramStatus={member.telegramStatus}
            inactiveLabel={memberInactiveLabel(member, {
              invited: t("teammate.invited"),
              inactive: t("teammate.inactive"),
            })}
            labels={{
              linked: t("teammate.linked"),
              pending: t("teammate.pending"),
            }}
          />
        }
      />
      {error === "promote" ? (
        <Banner variant="severity" className="mb-4">
          {t("teammate.promoteFailed")}
        </Banner>
      ) : null}
      {error === "demote" ? (
        <Banner variant="severity" className="mb-4">
          {t("teammate.demoteFailed")}
        </Banner>
      ) : null}
      {error === "transfer" ? (
        <Banner variant="severity" className="mb-4">
          {t("teammate.transferFailed")}
        </Banner>
      ) : null}
      {error === "edit" ? (
        <Banner variant="severity" className="mb-4">
          {t("teammate.editFailed")}
        </Banner>
      ) : null}
      {error === "remove" ? (
        <Banner variant="severity" className="mb-4">
          {t("teammate.removeFailed")}
        </Banner>
      ) : null}
      {error === "invite" ? (
        <Banner variant="severity" className="mb-4">
          {t("teammate.inviteFailed")}
        </Banner>
      ) : null}
      <div className="grid max-w-2xl gap-4">
        <Card>
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
            {member.displayName ? (
              <p>
                <span className="text-[var(--text-muted)]">{t("teammate.fantasyName")}:</span>{" "}
                {member.displayName}
              </p>
            ) : null}
            <p>
              <span className="text-[var(--text-muted)]">{t("teammate.roleColumn")}:</span>{" "}
              {t(`roles.${member.role}`)}
            </p>
          </CardBody>
        </Card>

        {isOperator ? (
          <>
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold">{t("teammate.editSection")}</h2>
              </CardHeader>
              <CardBody>
                <form action={updateTeammateForm.bind(null, locale, id)} className="space-y-4">
                  <div>
                    <Label htmlFor="displayName" className="mb-0">
                      {t("teammate.fantasyName")}
                    </Label>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {t("teammate.fantasyNameHint")}
                    </p>
                    <Input
                      id="displayName"
                      name="displayName"
                      className="mt-1.5"
                      defaultValue={member.displayName ?? ""}
                      placeholder={t("teammate.fantasyNamePlaceholder")}
                    />
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
              <ExportDataButton
                userId={id}
                label={t("teammate.export")}
                variant="secondary"
              />
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
          </>
        ) : null}
      </div>
    </>
  );
}
