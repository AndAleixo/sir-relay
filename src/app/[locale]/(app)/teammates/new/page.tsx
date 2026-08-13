import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createTeammateForm } from "@/app/actions/teammates";
import { getServices } from "@/services";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/layout/app-shell";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export default async function NewTeammatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations();
  const { auth } = getServices();
  const session = await auth.getSession();
  if (!session) return null;
  requireRole(session, "operator", locale);

  const errorMessage =
    error === "exists"
      ? t("teammate.createExists")
      : error === "inactive"
        ? t("teammate.createInactive")
      : error === "invalid"
        ? t("teammate.createInvalid")
        : error === "create"
          ? t("teammate.createFailed")
          : null;

  return (
    <>
      <PageHeader title={t("teammate.addTeammate")} />
      <Card className="max-w-xl">
        <CardBody className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">{t("teammate.newSubtitle")}</p>
          {errorMessage ? <Banner variant="severity">{errorMessage}</Banner> : null}
          <form action={createTeammateForm.bind(null, locale)} className="space-y-4">
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="teammate@example.com"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit">{t("teammate.createTeammate")}</Button>
              <Link href={`/${locale}/teammates`}>
                <Button variant="secondary">{t("common.cancel")}</Button>
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
}
