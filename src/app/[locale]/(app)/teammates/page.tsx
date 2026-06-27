import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { requireRole } from "@/lib/auth-guards";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";

export default async function TeammatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const { teammates, auth } = getServices();
  const session = await auth.getSession();
  if (!session) return null;
  requireRole(session, "operator", locale);

  const list = await teammates.listTeammates();

  return (
    <>
      <PageHeader
        title={t("common.teammates")}
        action={<Button>{t("teammate.addTeammate")}</Button>}
      />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {list.map((tm) => (
          <Link key={tm.id} href={`/${locale}/teammates/${tm.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardBody>
                <h2 className="font-semibold">{tm.name}</h2>
                <p className="text-sm text-[var(--text-muted)]">{tm.email}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <ToneBadge tone={tm.telegramStatus === "linked" ? "success" : "warning"}>
                    {tm.telegramStatus === "linked"
                      ? t("teammate.linked")
                      : t("teammate.pending")}
                  </ToneBadge>
                  <ToneBadge tone="neutral">
                    {tm.accountStatus === "active"
                      ? t("teammate.active")
                      : t("teammate.invited")}
                  </ToneBadge>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
