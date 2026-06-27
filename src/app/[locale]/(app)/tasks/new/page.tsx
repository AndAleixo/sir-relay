import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { requireRole } from "@/lib/auth-guards";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const { auth } = getServices();
  const session = await auth.getSession();
  if (!session) return null;
  requireRole(session, "operator", locale);

  return (
    <>
      <PageHeader title={t("common.newTask")} />
      <Card className="max-w-xl">
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Task title" />
          </div>
          <div>
            <Label htmlFor="assignee">{t("tasks.assignee")}</Label>
            <Input id="assignee" placeholder="Select teammate (mock)" disabled />
          </div>
          <div>
            <Label htmlFor="due">{t("tasks.dueDate")}</Label>
            <Input id="due" type="date" />
          </div>
          <div>
            <Label htmlFor="desc">{t("tasks.description")}</Label>
            <Textarea id="desc" placeholder="Optional description" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button">{t("common.save")}</Button>
            <Link href={`/${locale}/tasks`}>
              <Button variant="secondary">{t("common.cancel")}</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
