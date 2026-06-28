import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { TasksPageHeader } from "@/components/layout/page-headers/tasks-page-header";
import { TasksPageClient } from "@/components/tasks/tasks-page-client";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const { auth, tasks, teammates, alerts } = getServices();
  const session = await auth.getSession();
  if (!session) return null;

  const isOperator = session.user.role === "operator";
  const taskList = await tasks.listTasks({ session });
  const teammateList = isOperator ? await teammates.listTeammates() : [];

  if (isOperator) {
    await alerts.syncDueAlerts(taskList);
  }

  return (
    <>
      <TasksPageHeader
        locale={locale}
        title={isOperator ? t("tasks.allTasks") : t("tasks.myTasks")}
        showNewTask={isOperator}
      />
      <TasksPageClient
        locale={locale}
        role={session.user.role}
        operator={
          isOperator
            ? { id: session.user.id, name: session.user.name }
            : undefined
        }
        tasks={taskList}
        teammates={teammateList}
        labels={{
          board: t("common.board"),
          list: t("common.list"),
          myTasks: t("tasks.myTasks"),
          allTasks: t("tasks.allTasks"),
          assignee: t("tasks.assignee"),
          dueDate: t("tasks.dueDate"),
          updated: t("tasks.updated"),
          overdue: t("tasks.overdue"),
          emptyMine: t("tasks.emptyMine"),
          emptyBoard: t("teammate.emptyBoard"),
          sectionTodo: t("tasks.sectionTodo"),
          sectionDoing: t("tasks.sectionDoing"),
          sectionDone: t("tasks.sectionDone"),
          linked: t("teammate.linked"),
          pending: t("teammate.pending"),
          invited: t("teammate.invited"),
          active: t("teammate.active"),
          viewAll: t("common.viewAll"),
          dragHandle: t("common.dragHandle"),
          meColumn: t("tasks.meColumn"),
          webOnly: t("tasks.webOnly"),
          openTask: t("tasks.openTask"),
          addTask: t("tasks.addTask"),
          addDueDate: t("tasks.addDueDate"),
          titlePlaceholder: t("tasks.titlePlaceholder"),
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
