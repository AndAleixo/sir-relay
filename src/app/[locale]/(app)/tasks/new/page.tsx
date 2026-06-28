import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { mockCreateTask } from "@/app/actions/mock-tasks";
import { getServices } from "@/services";
import { requireRole } from "@/lib/auth-guards";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const { auth, teammates } = getServices();
  const session = await auth.getSession();
  if (!session) return null;
  requireRole(session, "operator", locale);

  const teammateList = await teammates.listTeammates();

  return (
    <>
      <PageHeader title={t("common.newTask")} />
      <Card className="max-w-xl">
        <CardBody className="space-y-4">
          <form action={mockCreateTask.bind(null, locale)} className="space-y-4">
            <div>
              <Label htmlFor="title">{t("tasks.titleLabel")}</Label>
              <Input id="title" name="title" required placeholder={t("tasks.titlePlaceholder")} />
            </div>
            <div>
              <Label htmlFor="assigneeId">{t("tasks.assignee")}</Label>
              <Select id="assigneeId" name="assigneeId" required defaultValue={session.user.id}>
                <option value={session.user.id}>
                  {t("tasks.assignToMe", { name: session.user.name })}
                </option>
                {teammateList.map((teammate) => (
                  <option key={teammate.id} value={teammate.id}>
                    {teammate.name}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">{t("tasks.assigneeHint")}</p>
            </div>
            <div>
              <Label htmlFor="dueDate">{t("tasks.dueDate")}</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
            <div>
              <Label htmlFor="description">{t("tasks.description")}</Label>
              <Textarea id="description" name="description" placeholder={t("tasks.descriptionPlaceholder")} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit">{t("common.save")}</Button>
              <Link href={`/${locale}/tasks`}>
                <Button variant="secondary">{t("common.cancel")}</Button>
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
}
