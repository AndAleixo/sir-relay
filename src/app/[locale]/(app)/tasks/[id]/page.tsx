import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { renotifyTaskAction } from "@/app/actions/tasks";
import { requireAppSession } from "@/lib/require-session";
import { groupMemberLabel } from "@/lib/group-member-label";
import { getServices } from "@/services";
import { isOverdue } from "@/lib/dates";
import { PageHeader } from "@/components/layout/app-shell";
import { EditTaskForm } from "@/components/tasks/task-form";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import type { TaskStatus } from "@/domain/types";

export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ renotify?: string }>;
}) {
  const { locale, id } = await params;
  const { renotify } = await searchParams;
  const t = await getTranslations();
  const session = await requireAppSession(locale);
  const { tasks, teammates } = getServices();

  const task = await tasks.getTask(id, { session });
  if (!task) notFound();

  const overdue = isOverdue(task.dueDate);
  const isOperator = session.user.role === "operator";

  const orgUsers = isOperator
    ? await teammates.listOrganizationUsers({ session })
    : [];
  const me = orgUsers.find((user) => user.id === session.user.id);
  const assigneeMember = isOperator
    ? orgUsers.find((user) => user.id === task.assigneeId) ?? null
    : null;
  const assigneeTeammate =
    assigneeMember?.role === "teammate" ? assigneeMember : null;
  const assigneeTelegramPending =
    isOperator &&
    assigneeTeammate &&
    assigneeTeammate.telegramStatus === "pending" &&
    task.assigneeId !== session.user.id;

  const assigneeOptions = isOperator
    ? [
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
        title={t("tasks.editTask")}
        action={
          <div className="flex flex-wrap gap-2">
            {isOperator && assigneeTeammate ? (
              <form action={renotifyTaskAction.bind(null, locale, id)}>
                <Button type="submit" variant="secondary">
                  {t("tasks.renotify")}
                </Button>
              </form>
            ) : null}
            <Link href={`/${locale}/tasks`}>
              <Button variant="secondary">{t("common.back")}</Button>
            </Link>
          </div>
        }
      />

      {renotify === "1" ? (
        <Banner variant="info" className="mb-4">
          {t("tasks.renotifyDone")}
        </Banner>
      ) : null}

      {task.telegramNotifyFailed && (
        <Banner variant="danger" className="mb-4">
          {t("tasks.telegramFailed")}
        </Banner>
      )}

      {assigneeTelegramPending ? (
        <Banner variant="warning" className="mb-4">
          {t("tasks.telegramPending")}
        </Banner>
      ) : null}

      <Card className="max-w-xl">
        <CardBody className="space-y-4">
          {isOperator && assigneeTeammate ? (
            <p className="text-xs text-[var(--text-muted)]">{t("tasks.renotifyHint")}</p>
          ) : null}
          <EditTaskForm
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
