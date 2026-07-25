import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { orderMembersByTodoCount } from "@/lib/board-member-order";
import { groupMemberLabel } from "@/lib/group-member-label";
import { requireAppSession } from "@/lib/require-session";
import {
  parseTasksScope,
  parseTasksView,
} from "@/lib/tasks-url";
import { getServices } from "@/services";
import { TasksPageClient } from "@/components/tasks/tasks-page-client";
import { Banner } from "@/components/ui/banner";

export default async function TasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    scope?: string;
    view?: string;
    saved?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  const { locale } = await params;
  const {
    scope: scopeRaw,
    view: viewRaw,
    saved,
    deleted,
    error,
  } = await searchParams;
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

  const initialScope = parseTasksScope(scopeRaw, session.user.role);
  const initialView = parseTasksView(viewRaw);

  return (
    <>
      <PageHeader title={t("common.tasks")} />
      {saved === "1" ? (
        <Banner variant="info" className="mb-4">
          {t("tasks.saved")}
        </Banner>
      ) : null}
      {deleted === "1" ? (
        <Banner variant="info" className="mb-4">
          {t("tasks.deleted")}
        </Banner>
      ) : null}
      {error === "not_found" ? (
        <Banner variant="danger" className="mb-4">
          {t("tasks.errorNotFound")}
        </Banner>
      ) : null}
      <TasksPageClient
        locale={locale}
        role={session.user.role}
        initialScope={initialScope}
        initialView={initialView}
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
          scopeAria: t("tasks.scopeAria"),
          newTask: t("common.newTask"),
          assignee: t("tasks.assignee"),
          dueDate: t("tasks.dueDate"),
          updated: t("tasks.updated"),
          overdue: t("tasks.overdue"),
          emptyBoard: t("tasks.emptyBoard"),
          emptyMyWork: t("tasks.emptyMyWork"),
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
          taskMenu: t("tasks.taskMenu"),
          cloneTask: t("tasks.cloneTask"),
          deleteTask: t("tasks.delete"),
          deleteConfirm: t("tasks.deleteConfirm"),
          filterAssignee: t("tasks.filterAssignee"),
          filterStatus: t("tasks.filterStatus"),
          filterSort: t("tasks.filterSort"),
          filterAll: t("tasks.filterAll"),
          sortDue: t("tasks.sortDue"),
          sortStatus: t("tasks.sortStatus"),
          sortUpdated: t("tasks.sortUpdated"),
          statusColumn: t("tasks.status"),
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
