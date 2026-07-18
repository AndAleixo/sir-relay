import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { requireAppSession } from "@/lib/require-session";
import { getServices } from "@/services";
import { TasksPageClient } from "@/components/tasks/tasks-page-client";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const session = await requireAppSession(locale);
  const { tasks, teammates, alerts } = getServices();

  const isOperator = session.user.role === "operator";
  const taskList = await tasks.listTasks({ session });
  const orgUsers = isOperator
    ? await teammates.listOrganizationUsers({ session })
    : [];
  const operatorMember = orgUsers.find((user) => user.id === session.user.id);
  const otherMembers = orgUsers.filter((user) => user.id !== session.user.id);

  if (isOperator) {
    await alerts.syncDueAlerts(taskList, { session });
  }

  return (
    <>
      <PageHeader title={t("common.tasks")} />
      <TasksPageClient
      locale={locale}
      role={session.user.role}
      showNewTask={isOperator}
      operator={
          isOperator
            ? {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                displayName: operatorMember?.displayName ?? null,
                telegramStatus:
                  operatorMember?.telegramStatus ?? session.user.telegramStatus,
              }
            : undefined
        }
        tasks={taskList}
        members={otherMembers}
        labels={{
          board: t("common.board"),
          list: t("common.list"),
          newTask: t("common.newTask"),
          assignee: t("tasks.assignee"),
          dueDate: t("tasks.dueDate"),
          updated: t("tasks.updated"),
          overdue: t("tasks.overdue"),
          emptyMine: t("tasks.emptyMine"),
          emptyBoard: t("teammate.emptyBoard"),
          sectionTodo: t("tasks.sectionTodo"),
          sectionDoing: t("tasks.sectionDoing"),
          sectionDone: t("tasks.sectionDone"),
          startDoing: t("tasks.startDoing"),
          markDone: t("tasks.markDone"),
          completedMark: t("tasks.completedMark"),
          linked: t("teammate.linked"),
          pending: t("teammate.pending"),
          invited: t("teammate.invited"),
          active: t("teammate.active"),
          operatorRole: t("roles.operator"),
          viewAll: t("common.viewAll"),
          dragHandle: t("common.dragHandle"),
          openTask: t("tasks.openTask"),
          addTask: t("tasks.addTask"),
          addDueDate: t("tasks.addDueDate"),
          titlePlaceholder: t("tasks.titlePlaceholder"),
          titleColumn: t("tasks.titleColumn"),
          filterAssignee: t("tasks.filterAssignee"),
          filterStatus: t("tasks.filterStatus"),
          filterSort: t("tasks.filterSort"),
          filterAll: t("tasks.filterAll"),
          sortDue: t("tasks.sortDue"),
          sortStatus: t("tasks.sortStatus"),
          sortUpdated: t("tasks.sortUpdated"),
          status: {
            todo: t("status.todo"),
            doing: t("status.doing"),
            done: t("status.done"),
          },
        }}
      />
    </>
  );
}
