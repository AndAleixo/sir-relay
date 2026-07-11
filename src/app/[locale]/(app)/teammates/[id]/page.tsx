import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { requireRole } from "@/lib/auth-guards";
import { PageHeader } from "@/components/layout/app-shell";
import { ExportDataButton } from "@/components/teammates/export-data-button";
import { ToneBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export default async function TeammateDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations();
  const { teammates, auth } = getServices();
  const session = await auth.getSession();
  if (!session) return null;
  requireRole(session, "operator", locale);

  const teammate = await teammates.getTeammate(id);
  if (!teammate) notFound();

  const inviteUrl = `https://app.example.com/${locale}/admin`;
  const telegramUrl = "t.me/SirRelayBot?start=mock-code";

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
          </CardBody>
        </Card>
      </div>
    </>
  );
}
