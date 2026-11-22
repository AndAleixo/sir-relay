import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { orderMembersByTodoCount } from "@/lib/board-member-order";
import { groupMemberLabel } from "@/lib/group-member-label";
import { requireAppSession } from "@/lib/require-session";
import {
  parseTasksCompose,
  parseTasksProject,
  parseTasksScope,
  parseTasksView,
} from "@/lib/tasks-url";
import { getAiSuggestQuota } from "@/lib/ai-suggest-quota-store";
import { openaiConfigured } from "@/lib/ingest";
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
    compose?: string;
  }>;
}) {
  const { locale } = await params;
  const {
    scope: scopeRaw,
    view: viewRaw,
    project: projectRaw,
    error,
    compose: composeRaw,
  } = await searchParams;
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
  const aiOn = openaiConfigured();
  const aiQuota = aiOn
    ? await getAiSuggestQuota(session.user.id)
    : null;

  return (
    <>
      <PageHeader title={t("common.tasks")} />
      {error === "not_found" ? (
        <Banner variant="severity" className="mb-4">
          {t("tasks.errorNotFound")}
        </Banner>
      ) : error === "title" ? (
        <Banner variant="severity" className="mb-4">
          {t("tasks.errorTitle")}
        </Banner>
      ) : error === "assignee" ? (
        <Banner variant="severity" className="mb-4">
          {t("tasks.errorAssignee")}
        </Banner>
      ) : error === "failed" ? (
        <Banner variant="severity" className="mb-4">
          {t("tasks.errorFailed")}
        </Banner>
      ) : null}
      <TasksPageClient
        locale={locale}
        role={session.user.role}
        initialScope={initialScope}
        initialView={initialView}
        initialProject={initialProject}
        initialCompose={parseTasksCompose(composeRaw)}
        aiEnabled={aiOn}
        aiRemaining={aiQuota?.remaining ?? 0}
        aiLimit={aiQuota?.limit ?? 5}
        openProjects={openProjects}
        self={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          displayName: selfMember?.displayName ?? null,
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
          newTaskAi: t("tasks.composeAiOpen"),
          assignee: t("tasks.assignee"),
          dueDate: t("tasks.dueDate"),
          updated: t("tasks.updated"),
          overdue: t("tasks.overdue"),
          emptyBoard: t("tasks.emptyBoard"),
          emptyMyWork: t("tasks.emptyMyWork"),
          startDoing: t("tasks.startDoing"),
          markDone: t("tasks.markDone"),
          completedMark: t("tasks.completedMark"),
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
          category: t("tasks.category"),
          categoryNone: t("tasks.categoryNone"),
          compose: {
            drawerTitle: t("tasks.composeTitle"),
            aiDrawerTitle: t("tasks.composeAiTitle"),
            close: t("common.close"),
            save: t("common.save"),
            accept: t("tasks.composeAccept"),
            reject: t("tasks.composeReject"),
            acceptAll: t("tasks.composeAcceptAll"),
            rejectAll: t("tasks.composeRejectAll"),
            aiReviewTitle: t("tasks.composeAiReviewTitle"),
            aiPlaceholder: t("tasks.composeAiPlaceholder"),
            aiSubmit: t("tasks.composeAiSubmit"),
            aiSuggesting: t("tasks.composeAiSuggesting"),
            closeConfirm: t("tasks.composeCloseConfirm"),
            aiQuota: t("tasks.composeAiQuota"),
            errorSuggest: t("tasks.composeErrorSuggest"),
            errorApprove: t("tasks.composeErrorApprove"),
            errorQuota: t("tasks.composeErrorQuota"),
            errorTooLong: t("tasks.composeErrorTooLong"),
            title: t("tasks.title"),
            titlePlaceholder: t("tasks.titlePlaceholder"),
            assignee: t("tasks.assignee"),
            assigneeHint: t("tasks.assigneeHint"),
            dueDate: t("tasks.dueDate"),
            description: t("tasks.description"),
            descriptionPlaceholder: t("tasks.descriptionPlaceholder"),
            status: t("tasks.status"),
            overdue: t("tasks.overdue"),
            difficulty: t("tasks.difficulty"),
            difficultyNone: t("tasks.difficultyNone"),
            difficultyEasy: t("tasks.difficultyEasy"),
            difficultyMedium: t("tasks.difficultyMedium"),
            difficultyHard: t("tasks.difficultyHard"),
            project: t("tasks.project"),
            projectNone: t("tasks.projectNone"),
            category: t("tasks.category"),
            categoryNone: t("tasks.categoryNone"),
          },
        }}
      />
    </>
  );
}
