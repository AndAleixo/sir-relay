import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { orderMembersByTodoCount } from "@/lib/board-member-order";
import { groupMemberLabel } from "@/lib/group-member-label";
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
  const orgUsers = await teammates.listOrganizationUsers({ session });
  const selfMember = orgUsers.find((user) => user.id === session.user.id);
  const otherMembers = orgUsers.filter((user) => user.id !== session.user.id);
  const boardMembers = orderMembersByTodoCount(
    otherMembers,
    taskList,
    groupMemberLabel,
  );

  if (isOperator) {
    await alerts.syncDueAlerts(taskList, { session });
  }

  return (
    <>
      <PageHeader title={t("common.tasks")} />
      <TasksPageClient
        locale={locale}
        role={session.user.role}
        self={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          displayName: selfMember?.displayName ?? null,
          telegramStatus:
            selfMember?.telegramStatus ?? session.user.telegramStatus,
        }}
        tasks={taskList}
        members={boardMembers}
        labels={{
          board: t("common.board"),
          list: t("common.list"),
          myWork: t("tasks.myWork"),
          team: t("tasks.team"),
          newTask: t("common.newTask"),
          assignee: t("tasks.assignee"),
          dueDate: t("tasks.dueDate"),
          updated: t("tasks.updated"),
          overdue: t("tasks.overdue"),
          emptyBoard: t("tasks.emptyBoard"),
          sectionTodo: t("tasks.sectionTodo"),
          sectionDoing: t("tasks.sectionDoing"),
          sectionDone: t("tasks.sectionDone"),
          startDoing: t("tasks.startDoing"),
          markDone: t("tasks.markDone"),
          completedMark: t("tasks.completedMark"),
          linked: t("teammate.linked"),
          pending: t("teammate.pending"),
          invited: t("teammate.invited"),
          inactive: t("teammate.inactive"),
          showMore: t("common.showMore"),
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
