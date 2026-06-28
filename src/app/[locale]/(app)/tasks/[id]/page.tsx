import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { formatDueDate, formatRelativeTime, isOverdue } from "@/lib/dates";
import { PageHeader } from "@/components/layout/app-shell";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge, ToneBadge } from "@/components/ui/badge";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations();
  const { auth, tasks } = getServices();
  const session = await auth.getSession();
  if (!session) return null;

  const task = await tasks.getTask(id, { session });
  if (!task) notFound();

  const comments = await tasks.listComments(id);
  const overdue = isOverdue(task.dueDate);

  return (
    <>
      <PageHeader
        title={task.title}
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
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge
                status={task.status}
                label={t(`status.${task.status}`)}
              />
              <span className="text-sm text-[var(--text-muted)]">
                {t("tasks.assignee")}: {task.assigneeName}
              </span>
              <span
                className={
                  overdue
                    ? "text-sm font-medium text-[var(--danger)]"
                    : "text-sm text-[var(--text-muted)]"
                }
              >
                {t("tasks.dueDate")}: {formatDueDate(task.dueDate, locale)}
                {overdue && ` · ${t("tasks.overdue")}`}
              </span>
            </div>
          </CardHeader>
          <CardBody>
            <h2 className="mb-2 text-sm font-medium text-[var(--text-muted)]">
              {t("tasks.description")}
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {task.description}
            </p>
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
