import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { requireRole } from "@/lib/require-session";
import { groupMemberLabel } from "@/lib/group-member-label";
import { PageHeader } from "@/components/layout/app-shell";
import { CreateTaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

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

  const orgUsers = await teammates.listOrganizationUsers({ session });
  const me = orgUsers.find((user) => user.id === session.user.id);
  const assigneeOptions = [
    {
      id: session.user.id,
      label: t("tasks.assignToMe", {
        name: groupMemberLabel({
          ...session.user,
          displayName: me?.displayName,
        }),
      }),
    },
    ...orgUsers
      .filter((user) => user.id !== session.user.id)
      .map((user) => ({
        id: user.id,
        label: groupMemberLabel(user),
      })),
  ];

  return (
    <>
      <PageHeader
        title={t("common.newTask")}
        action={
          <Link href={`/${locale}/tasks`}>
            <Button variant="secondary">{t("common.back")}</Button>
          </Link>
        }
      />
      <Card className="max-w-xl">
        <CardBody className="space-y-4">
          <CreateTaskForm
            locale={locale}
            isOperator
            assigneeOptions={assigneeOptions}
            labels={{
              title: t("tasks.titleLabel"),
              titlePlaceholder: t("tasks.titlePlaceholder"),
              assignee: t("tasks.assignee"),
              assigneeHint: t("tasks.assigneeHint"),
              dueDate: t("tasks.dueDate"),
              description: t("tasks.description"),
              descriptionPlaceholder: t("tasks.descriptionPlaceholder"),
              status: t("tasks.status"),
              overdue: t("tasks.overdue"),
              save: t("common.save"),
              cancel: t("common.cancel"),
            }}
          />
        </CardBody>
      </Card>
    </>
  );
}
