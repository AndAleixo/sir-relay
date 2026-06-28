import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { formatRelativeTime, isOverdue } from "@/lib/dates";
import { PageHeader } from "@/components/layout/app-shell";
import { TaskDetailEditor } from "@/components/tasks/task-detail-editor";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ToneBadge } from "@/components/ui/badge";
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

  const comments = await tasks.listComments(id);
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
              }}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">{t("tasks.comments")}</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                {t("tasks.noComments")}
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-card border border-[var(--border)] p-3"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <ToneBadge tone={comment.source === "telegram" ? "accent" : "neutral"}>
                      {comment.source === "telegram" ? "Telegram" : "Web"}
                    </ToneBadge>
                    <span className="text-xs font-medium">{comment.authorName}</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatRelativeTime(comment.createdAt, locale)}
                    </span>
                  </div>
                  <p className="text-sm">{comment.body}</p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
