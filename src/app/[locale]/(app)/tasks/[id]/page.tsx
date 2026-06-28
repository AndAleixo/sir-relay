import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { isOverdue } from "@/lib/dates";
import { PageHeader } from "@/components/layout/app-shell";
import { TaskDetailEditor } from "@/components/tasks/task-detail-editor";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import type { TaskStatus } from "@/domain/types";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations();
  const { auth, tasks, teammates } = getServices();
  const session = await auth.getSession();
  if (!session) return null;

  const task = await tasks.getTask(id, { session });
  if (!task) notFound();

  const overdue = isOverdue(task.dueDate);
  const isOperator = session.user.role === "operator";

  const assigneeOptions = isOperator
    ? [
        {
          id: session.user.id,
          name: session.user.name,
          label: t("tasks.assignToMe", { name: session.user.name }),
        },
        ...(await teammates.listTeammates()).map((teammate) => ({
          id: teammate.id,
          name: teammate.name,
          label: teammate.name,
        })),
      ]
    : [];

  const statusLabels: Record<TaskStatus, string> = {
    todo: t("status.todo"),
    doing: t("status.doing"),
    done: t("status.done"),
  };

  return (
    <>
      <PageHeader
        action={
          <Link href={`/${locale}/tasks`}>
            <Button variant="secondary">{t("common.back")}</Button>
          </Link>
        }
      />

      {task.telegramNotifyFailed && (
        <Banner variant="danger" className="mb-4">
          {t("tasks.telegramFailed")}
        </Banner>
      )}

      <Card className="max-w-xl">
        <CardBody>
          <TaskDetailEditor
            task={task}
            locale={locale}
            isOperator={isOperator}
            assigneeOptions={assigneeOptions}
            overdue={overdue}
            statusLabels={statusLabels}
            labels={{
              title: t("tasks.titleLabel"),
              titlePlaceholder: t("tasks.titlePlaceholder"),
              assignee: t("tasks.assignee"),
              assigneeHint: t("tasks.assigneeHint"),
              dueDate: t("tasks.dueDate"),
              description: t("tasks.description"),
              descriptionPlaceholder: t("tasks.descriptionPlaceholder"),
              status: t("tasks.status"),
              save: t("common.save"),
              cancel: t("common.cancel"),
              overdue: t("tasks.overdue"),
              delete: t("tasks.delete"),
              deleteConfirm: t("tasks.deleteConfirm"),
            }}
          />
        </CardBody>
      </Card>
    </>
  );
}
