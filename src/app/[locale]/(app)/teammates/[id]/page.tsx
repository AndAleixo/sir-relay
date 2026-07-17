import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { regenerateInviteForm, updateTeammateForm } from "@/app/actions/teammates";
import { Banner } from "@/components/ui/banner";
import { PageHeader } from "@/components/layout/app-shell";
import { CopyLinkButton } from "@/components/teammates/copy-link-button";
import { PromoteTeammateButton } from "@/components/teammates/promote-teammate-button";
import { RemoveTeammateButton } from "@/components/teammates/remove-teammate-button";
import { ToneBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { joinInviteUrl } from "@/lib/app-url";
import { groupMemberLabel } from "@/lib/group-member-label";
import { getServices } from "@/services";
import { requireRole } from "@/lib/require-session";

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
  const { teammates, auth } = getServices();
  const session = await auth.getSession();
  if (!session) return null;
  requireRole(session, "operator", locale);

  const teammate = await teammates.getTeammate(id, { session });
  if (!teammate) redirect(`/${locale}/teammates`);

  const label = groupMemberLabel(teammate);
  const inviteToken =
    teammate.accountStatus === "invited"
      ? await teammates.getInviteToken(id, { session })
      : null;
  const inviteUrl = inviteToken ? joinInviteUrl(locale, inviteToken) : "";

  return (
    <>
      <PageHeader title={label} />
      {error === "promote" ? (
        <Banner variant="danger" className="mb-4">
          {t("teammate.promoteFailed")}
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
              <ToneBadge tone={teammate.telegramStatus === "linked" ? "success" : "warning"}>
                {teammate.telegramStatus === "linked"
                  ? t("teammate.linked")
                  : t("teammate.pending")}
              </ToneBadge>
              <ToneBadge tone="neutral">
                {teammate.accountStatus === "active"
                  ? t("teammate.active")
                  : t("teammate.invited")}
              </ToneBadge>
            </div>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p>
              <span className="text-[var(--text-muted)]">{t("auth.email")}:</span>{" "}
              {teammate.email}
            </p>
            {teammate.name.trim() ? (
              <p>
                <span className="text-[var(--text-muted)]">{t("profile.accountName")}:</span>{" "}
                {teammate.name}
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
                  defaultValue={teammate.displayName ?? ""}
                  placeholder={t("teammate.fantasyNamePlaceholder")}
                />
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {t("teammate.fantasyNameHint")}
                </p>
              </div>
              {teammate.accountStatus === "invited" ? (
                <div>
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={teammate.email}
                    required
                  />
                </div>
              ) : null}
              <Button type="submit">{t("common.save")}</Button>
            </form>
          </CardBody>
        </Card>

        {teammate.accountStatus === "invited" ? (
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

        {teammate.active && teammate.accountStatus === "active" ? (
          <PromoteTeammateButton
            locale={locale}
            teammateId={id}
            label={t("teammate.promoteToOperator")}
            confirmMessage={t("teammate.promoteConfirm", { name: label })}
          />
        ) : null}

        <RemoveTeammateButton
          locale={locale}
          teammateId={id}
          label={t("teammate.remove")}
          confirmMessage={t("teammate.removeConfirm")}
        />
      </div>
    </>
  );
}
