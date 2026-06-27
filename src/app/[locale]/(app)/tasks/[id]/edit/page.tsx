import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { requireRole } from "@/lib/auth-guards";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations();
  const { auth } = getServices();
  const session = await auth.getSession();
  if (!session) return null;
  requireRole(session, "operator", locale);

  return (
    <>
      <PageHeader title={t("common.edit")} />
      <Card className="max-w-xl">
        <CardBody className="space-y-4">
          <p className="text-xs text-[var(--text-muted)]">Mock edit · task {id}</p>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" defaultValue="Sample task" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button">{t("common.save")}</Button>
            <Link href={`/${locale}/tasks/${id}`}>
              <Button variant="secondary">{t("common.cancel")}</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
