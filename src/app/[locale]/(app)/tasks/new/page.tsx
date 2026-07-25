import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { requireAppSession } from "@/lib/require-session";
import { groupMemberLabel } from "@/lib/group-member-label";
import {
  parseTasksScope,
  parseTasksView,
  tasksListHref,
} from "@/lib/tasks-url";
import { PageHeader } from "@/components/layout/app-shell";
import { CreateTaskForm } from "@/components/tasks/task-form";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export default async function NewTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    scope?: string;
    view?: string;
    error?: string;
  }>;
}) {
  const { locale } = await params;
  const { scope: scopeRaw, view: viewRaw, error } = await searchParams;
  const t = await getTranslations();
  const session = await requireAppSession(locale);
  const isOperator = session.user.role === "operator";
  const { teammates } = getServices();

  const scope = parseTasksScope(scopeRaw, session.user.role);
  const view = parseTasksView(viewRaw);
  const listHref = tasksListHref(locale, { scope, view });

  const assigneeOptions = isOperator
    ? await (async () => {
        const orgUsers = await teammates.listOrganizationUsers({ session });
        const me = orgUsers.find((user) => user.id === session.user.id);
        return [
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
      })()
    : [
        {
          id: session.user.id,
          label: t("tasks.assignToMe", {
            name: groupMemberLabel(session.user),
          }),
        },
      ];

  const errorMessage =
    error === "title"
      ? t("tasks.errorTitle")
      : error === "assignee"
        ? t("tasks.errorAssignee")
        : null;

  return (
    <>
      <PageHeader
        title={t("common.newTask")}
        action={
          <Link href={listHref}>
            <Button variant="secondary">{t("common.back")}</Button>
          </Link>
        }
      />
      {errorMessage ? (
        <Banner variant="danger" className="mb-4 max-w-xl">
          {errorMessage}
        </Banner>
      ) : null}
      <Card className="max-w-xl">
        <CardBody className="space-y-4">
          <CreateTaskForm
            locale={locale}
            scope={scope}
            view={view}
            isOperator={isOperator}
            assigneeOptions={assigneeOptions}
            labels={{
              title: t("tasks.title"),
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
