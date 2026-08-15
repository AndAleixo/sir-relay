import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { renotifyTaskAction } from "@/app/actions/tasks";
import { requireAppSession } from "@/lib/require-session";
import { groupMemberLabel } from "@/lib/group-member-label";
import {
  parseTasksProject,
  parseTasksScope,
  parseTasksView,
  tasksListHref,
} from "@/lib/tasks-url";
import { getServices } from "@/services";
import { formatDueDate, isOverdue } from "@/lib/dates";
import { formatTaskHeading } from "@/lib/project";
import { PageHeader } from "@/components/layout/app-shell";
import { EditTaskForm } from "@/components/tasks/task-form";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import type { TaskStatus } from "@/domain/types";

const DETAIL_ERRORS = [
  "title",
  "status",
  "forbidden",
  "assignee",
  "failed",
] as const;

type DetailError = (typeof DETAIL_ERRORS)[number];

function detailErrorMessage(
  error: string | undefined,
  t: (key: string) => string,
): string | null {
  if (!error || !DETAIL_ERRORS.includes(error as DetailError)) return null;
  const keys: Record<DetailError, string> = {
    title: "tasks.errorTitle",
    status: "tasks.errorStatus",
    forbidden: "tasks.errorForbidden",
    assignee: "tasks.errorAssignee",
    failed: "tasks.errorFailed",
  };
  return t(keys[error as DetailError]);
}

export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{
    error?: string;
    scope?: string;
    view?: string;
    project?: string;
  }>;
}) {
  const { locale, id } = await params;
  const { error, scope: scopeRaw, view: viewRaw, project: projectRaw } = await searchParams;
  const t = await getTranslations();
  const session = await requireAppSession(locale);
  const { tasks, teammates, projects } = getServices();

  const task = await tasks.getTask(id, { session });
  if (!task) notFound();

  const openProjects = await projects.listOpen({ session });
  const scope = parseTasksScope(scopeRaw, session.user.role);
  const view = parseTasksView(viewRaw);
  const project = parseTasksProject(
    projectRaw,
    openProjects.map((row) => row.id),
  );
  const listHref = tasksListHref(locale, { scope, view, project });

  const overdue = isOverdue(task.dueDate);
  const isOperator = session.user.role === "operator";
  const canEdit = isOperator || task.assigneeId === session.user.id;
  const errorMessage = detailErrorMessage(error, t);

  const orgUsers = isOperator
    ? await teammates.listOrganizationUsers({ session })
    : [];
  const me = orgUsers.find((user) => user.id === session.user.id);
  const assigneeMember = isOperator
    ? orgUsers.find((user) => user.id === task.assigneeId) ?? null
    : null;
  const assigneeTelegramPending =
    isOperator &&
    assigneeMember &&
    assigneeMember.telegramStatus === "pending";

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
        title={canEdit ? t("tasks.editTask") : t("tasks.viewTask")}
        action={
          <div className="flex flex-wrap gap-2">
            {isOperator && assigneeMember ? (
              <form action={renotifyTaskAction.bind(null, locale, id)}>
                <input type="hidden" name="returnScope" value={scope} />
                <input type="hidden" name="returnView" value={view} />
                <input type="hidden" name="returnProject" value={project ?? ""} />
                <Button type="submit" variant="secondary">
                  {t("tasks.renotify")}
                </Button>
              </form>
            ) : null}
            <Link href={listHref}>
              <Button variant="secondary">{t("common.back")}</Button>
            </Link>
          </div>
        }
      />

      {errorMessage ? (
        <Banner variant="severity" className="mb-4">
          {errorMessage}
        </Banner>
      ) : null}

      {task.telegramNotifyFailed && (
        <Banner variant="severity" className="mb-4">
          {t("tasks.telegramFailed")}
        </Banner>
      )}

      {assigneeTelegramPending ? (
        <Banner variant="warning" className="mb-4">
          {t("tasks.telegramPending")}
        </Banner>
      ) : null}

      {!canEdit ? (
        <Banner variant="info" className="mb-4">
          {t("tasks.readOnlyHint")}
        </Banner>
      ) : null}

      <Card className="max-w-xl">
        <CardBody className="space-y-4">
          {canEdit ? (
            <>
              {isOperator && assigneeMember ? (
                <p className="text-xs text-[var(--text-muted)]">
                  {t("tasks.renotifyHint")}
                </p>
              ) : null}
              <EditTaskForm
                task={task}
                locale={locale}
                scope={scope}
                view={view}
                project={project}
                isOperator={isOperator}
                assigneeOptions={assigneeOptions}
                projectOptions={[
                  ...(task.projectId &&
                  !openProjects.some((row) => row.id === task.projectId)
                    ? [
                        {
                          id: task.projectId,
                          label: task.projectAcronym ?? task.projectId,
                        },
                      ]
                    : []),
                  ...openProjects.map((row) => ({
                    id: row.id,
                    label: `${row.acronym} · ${row.name}`,
                  })),
                ]}
                overdue={overdue}
                statusLabels={statusLabels}
                labels={{
                  title: t("tasks.title"),
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
                  difficulty: t("tasks.difficulty"),
                  difficultyNone: t("tasks.difficultyNone"),
                  difficultyEasy: t("tasks.difficultyEasy"),
                  difficultyMedium: t("tasks.difficultyMedium"),
                  difficultyHard: t("tasks.difficultyHard"),
                  project: t("tasks.project"),
                  projectNone: t("tasks.projectNone"),
                  delete: t("tasks.delete"),
                  deleteConfirm: t("tasks.deleteConfirm"),
                }}
              />
            </>
          ) : (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[var(--text-muted)]">{t("tasks.title")}</dt>
                <dd className="mt-0.5 font-medium">
                  {formatTaskHeading(task.title, task.projectAcronym)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">{t("tasks.assignee")}</dt>
                <dd className="mt-0.5">{task.assigneeName}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">{t("tasks.status")}</dt>
                <dd className="mt-0.5">{statusLabels[task.status]}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">{t("tasks.difficulty")}</dt>
                <dd className="mt-0.5">
                  {task.difficulty
                    ? t(
                        task.difficulty === "easy"
                          ? "tasks.difficultyEasy"
                          : task.difficulty === "medium"
                            ? "tasks.difficultyMedium"
                            : "tasks.difficultyHard",
                      )
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">{t("tasks.dueDate")}</dt>
                <dd className="mt-0.5">
                  {task.dueDate ? (
                    <span className={overdue ? "font-medium text-[var(--severity)]" : undefined}>
                      {formatDueDate(task.dueDate, locale)}
                      {overdue ? ` · ${t("tasks.overdue")}` : null}
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">—</span>
                  )}
                </dd>
              </div>
              {task.description.trim() ? (
                <div>
                  <dt className="text-[var(--text-muted)]">{t("tasks.description")}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap">{task.description}</dd>
                </div>
              ) : null}
            </dl>
          )}
        </CardBody>
      </Card>
    </>
  );
}
