import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  regenerateInviteForm,
  regenerateTeammateTelegramLinkForm,
  updateTeammateForm,
} from "@/app/actions/teammates";
import { Banner } from "@/components/ui/banner";
import { ExportDataButton } from "@/components/teammates/export-data-button";
import { PageHeader } from "@/components/layout/app-shell";
import { DeactivateTeammateButton } from "@/components/teammates/deactivate-teammate-button";
import { PromoteTeammateButton } from "@/components/teammates/promote-teammate-button";
import { ToneBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { joinInviteUrl, telegramBotUrl } from "@/lib/app-url";
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

  const inviteToken = await teammates.getInviteToken(id, { session });
  const telegramToken = await teammates.getTelegramLinkToken(id, { session });
  const inviteUrl = inviteToken ? joinInviteUrl(locale, inviteToken) : "";
  const telegramUrl = telegramToken ? telegramBotUrl(telegramToken) : "";

  return (
    <>
      <PageHeader
        title={teammate.name}
        action={
          <ExportDataButton
            userId={teammate.id}
            label={t("teammate.export")}
            variant="secondary"
          />
        }
      />
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
              {!teammate.active ? (
                <ToneBadge tone="neutral">{t("teammate.deactivated")}</ToneBadge>
              ) : null}
            </div>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p>
              <span className="text-[var(--text-muted)]">{t("auth.email")}:</span>{" "}
              {teammate.email}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">{t("teammate.editSection")}</h2>
          </CardHeader>
          <CardBody>
            <form action={updateTeammateForm.bind(null, locale, id)} className="space-y-4">
              <div>
                <Label htmlFor="name">{t("teammate.name")}</Label>
                <Input id="name" name="name" defaultValue={teammate.name} required />
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

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">{t("teammate.inviteLink")}</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <code className="block break-all rounded-button bg-[var(--surface-bg)] p-2 text-xs">
              {inviteUrl}
            </code>
            <p className="text-xs text-[var(--text-muted)]">{t("teammate.inviteLinkHint")}</p>
            <form action={regenerateInviteForm.bind(null, locale, id)}>
              <Button type="submit" variant="secondary">
                {t("teammate.regenerateInvite")}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">{t("teammate.telegramLink")}</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <code className="block break-all rounded-button bg-[var(--surface-bg)] p-2 text-xs">
              {telegramUrl}
            </code>
            <p className="text-xs text-[var(--text-muted)]">{t("teammate.telegramLinkHint")}</p>
            <form action={regenerateTeammateTelegramLinkForm.bind(null, locale, id)}>
              <Button type="submit" variant="secondary">
                {t("teammate.regenerateTelegram")}
              </Button>
            </form>
          </CardBody>
        </Card>

        {teammate.active && teammate.accountStatus === "active" ? (
          <PromoteTeammateButton
            locale={locale}
            teammateId={id}
            label={t("teammate.promoteToOperator")}
            confirmMessage={t("teammate.promoteConfirm", { name: teammate.name })}
          />
        ) : null}

        {teammate.active ? (
          <DeactivateTeammateButton
            locale={locale}
            teammateId={id}
            label={t("teammate.deactivate")}
            confirmMessage={t("teammate.deactivateConfirm")}
          />
        ) : null}
      </div>
    </>
  );
}
