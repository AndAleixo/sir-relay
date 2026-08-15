import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { orderMembersByTodoCount } from "@/lib/board-member-order";
import { groupMemberLabel } from "@/lib/group-member-label";
import { requireAppSession } from "@/lib/require-session";
import {
  parseTasksProject,
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
    project?: string;
    error?: string;
  }>;
}) {
  const { locale } = await params;
  const { scope: scopeRaw, view: viewRaw, project: projectRaw, error } = await searchParams;
  const t = await getTranslations();
  const session = await requireAppSession(locale);
  const { tasks, teammates, alerts, projects } = getServices();

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
  const openProjects = await projects.listOpen({ session });
  const initialProject = parseTasksProject(
    projectRaw,
    openProjects.map((row) => row.id),
  );

  return (
    <>
      <PageHeader title={t("common.tasks")} />
      {error === "not_found" ? (
        <Banner variant="severity" className="mb-4">
          {t("tasks.errorNotFound")}
        </Banner>
      ) : null}
      <TasksPageClient
        locale={locale}
        role={session.user.role}
        initialScope={initialScope}
        initialView={initialView}
        initialProject={initialProject}
        openProjects={openProjects.map((row) => ({
          id: row.id,
          name: row.name,
          acronym: row.acronym,
        }))}
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
          viewAria: t("tasks.viewAria"),
          newTask: t("common.newTask"),
          assignee: t("tasks.assignee"),
          dueDate: t("tasks.dueDate"),
          updated: t("tasks.updated"),
          overdue: t("tasks.overdue"),
          emptyBoard: t("tasks.emptyBoard"),
          emptyMyWork: t("tasks.emptyMyWork"),
          startDoing: t("tasks.startDoing"),
          markDone: t("tasks.markDone"),
          completedMark: t("tasks.completedMark"),
          linked: t("teammate.linked"),
          pending: t("teammate.pending"),
          invited: t("teammate.invited"),
          inactive: t("teammate.inactive"),
          showMore: t("common.showMore"),
          dragHandle: t("common.dragHandle"),
          taskMenu: t("tasks.taskMenu"),
          menuOpen: t("tasks.menuOpen"),
          menuClone: t("tasks.menuClone"),
          menuDelete: t("tasks.menuDelete"),
          deleteConfirm: t("tasks.deleteConfirm"),
          telegramFailed: t("tasks.telegramFailed"),
          addTask: t("tasks.addTask"),
          addDueDate: t("tasks.addDueDate"),
          titlePlaceholder: t("tasks.titlePlaceholder"),
          title: t("tasks.title"),
          filterAssignee: t("tasks.filterAssignee"),
          filterStatus: t("tasks.filterStatus"),
          filterSort: t("tasks.filterSort"),
          filterAll: t("tasks.filterAll"),
          sortDue: t("tasks.sortDue"),
          sortUpdated: t("tasks.sortUpdated"),
          statusColumn: t("tasks.status"),
          status: {
            todo: t("status.todo"),
            doing: t("status.doing"),
            done: t("status.done"),
          },
          project: t("tasks.project"),
          projectNone: t("tasks.projectNone"),
          projectScrollLeft: t("tasks.projectScrollLeft"),
          projectScrollRight: t("tasks.projectScrollRight"),
          addProject: t("tasks.addProject"),
        }}
      />
    </>
  );
}
