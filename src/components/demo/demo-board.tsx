"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Task } from "@/domain/types";
import type { OrganizationUser } from "@/services/contracts";
import { DemoTutorial } from "@/components/demo/demo-tutorial";
import {
  useDemoActions,
  useDemoTutorial,
  useDemoWorkspace,
} from "@/components/demo/demo-provider";
import { useSync } from "@/components/sync";
import {
  TaskComposeDrawer,
  type ComposeDrawerLabels,
  type ComposeDrawerLocalAdapters,
} from "@/components/tasks/task-compose-drawer";
import { StatusKanban } from "@/components/tasks/status-kanban";
import { TaskListWithFilters } from "@/components/tasks/task-list/task-list-with-filters";
import { TeamBoard } from "@/components/tasks/team-board";
import {
  ProjectSelect,
  ScopeToggle,
  ViewToggle,
} from "@/components/tasks/view-toggle";
import { viewToggleStyles } from "@/components/tasks/view-toggle/view-toggle.styles";
import { Button, buttonCompact } from "@/components/ui/button";
import { suggestDemoTasksFromTextAction } from "@/app/actions/demo";
import { DEMO_AI_LIMIT, demoSuggestDrafts } from "@/lib/demo-ai-suggest";
import { demoMemberAsUser } from "@/lib/demo-workspace";
import type { PendingCreateDraft } from "@/lib/ingest";
import type { TasksComposeMode, TasksScope, TasksView } from "@/lib/tasks-url";

export function DemoBoard() {
  const locale = useLocale();
  const t = useTranslations();
  const workspace = useDemoWorkspace();
  const { tasks } = useSync();
  const { createTask } = useDemoActions();
  const { reportTutorialAction } = useDemoTutorial();
  const [scope, setScope] = useState<TasksScope>("team");
  const [view, setView] = useState<TasksView>("board");
  const [project, setProject] = useState<string | null>(null);
  const [composeMode, setComposeMode] = useState<TasksComposeMode | null>(null);
  const [aiUsed, setAiUsed] = useState(0);

  const self = workspace
    ? (workspace.members.find((member) => member.id === workspace.selfId) ??
      workspace.members[0])
    : null;

  const localAdapters: ComposeDrawerLocalAdapters = useMemo(
    () => ({
      suggest: async (text: string) => {
        if (!self || !workspace) return { ok: false, error: "suggest" };
        if (aiUsed >= DEMO_AI_LIMIT) {
          return {
            ok: false,
            error: "quota",
            remaining: 0,
            limit: DEMO_AI_LIMIT,
          };
        }

        const context = {
          defaultAssigneeId: self.id,
          members: workspace.members.map((member) => ({
            id: member.id,
            label: member.name,
          })),
          projects: workspace.projects.map((row) => ({
            id: row.id,
            name: row.name,
            acronym: row.acronym,
            categories: row.categories.map((category) => ({
              id: category.id,
              name: category.name,
            })),
          })),
        };

        const live = await suggestDemoTasksFromTextAction(
          locale,
          text,
          context,
        );

        // OpenAI off (mock/dev) → local drafts; otherwise use the live one-shot.
        const result =
          !live.ok && live.error === "disabled"
            ? demoSuggestDrafts(text, self.id, project)
            : live;

        if (!result.ok) {
          const error =
            result.error === "rate" || result.error === "quota"
              ? result.error
              : result.error === "too_long"
                ? "too_long"
                : "suggest";
          if (error === "rate" || error === "quota") {
            setAiUsed(DEMO_AI_LIMIT);
          }
          return {
            ok: false,
            error,
            remaining: 0,
            limit: DEMO_AI_LIMIT,
          };
        }

        reportTutorialAction("ai_suggest");
        setAiUsed(DEMO_AI_LIMIT);
        return {
          ok: true,
          drafts: result.drafts,
          remaining: 0,
          limit: DEMO_AI_LIMIT,
        };
      },
      create: async (drafts: PendingCreateDraft[]) => {
        if (!self) return { ok: false };
        const created: Task[] = [];
        for (const draft of drafts) {
          const ok = createTask({
            title: draft.title,
            assigneeId: draft.assigneeId || self.id,
            projectId: draft.projectId,
            description: draft.description,
            dueDate: draft.dueDate,
            difficulty: draft.difficulty ?? undefined,
          });
          if (!ok) return { ok: false };
          created.push({
            id: `demo-${Date.now().toString(36)}-${created.length}`,
            title: draft.title.trim(),
            description: draft.description,
            assigneeId: draft.assigneeId || self.id,
            assigneeName: self.name,
            status: "todo",
            difficulty: draft.difficulty,
            dueDate: draft.dueDate,
            telegramNotifyFailed: false,
            projectId: draft.projectId,
            projectAcronym: null,
            categoryId: draft.categoryId,
            categoryName: null,
            sortOrder: created.length,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
        return { ok: true, tasks: created };
      },
    }),
    [aiUsed, createTask, locale, project, reportTutorialAction, self, workspace],
  );

  const openCompose = useCallback((mode: TasksComposeMode) => {
    setComposeMode(mode);
  }, []);

  const setBoardView = useCallback(
    (next: TasksView) => {
      setView((prev) => {
        if (prev !== next) reportTutorialAction("toggle_view");
        return next;
      });
    },
    [reportTutorialAction],
  );

  if (!workspace || !self) return null;

  const aiRemaining = Math.max(0, DEMO_AI_LIMIT - aiUsed);

  const members: OrganizationUser[] = workspace.members
    .filter((member) => member.id !== self.id)
    .map((member) => {
      const user = demoMemberAsUser(member, workspace.selfId, locale);
      return {
        ...user,
        role: "teammate" as const,
        accountStatus: "active" as const,
        telegramStatus: user.telegramStatus ?? "pending",
      };
    });

  const openProjects = workspace.projects.filter(
    (row) => !row.archivedAt && !row.pendingAt,
  );
  const boardProjects = openProjects.map((row) => ({
    id: row.id,
    name: row.name,
    acronym: row.acronym,
  }));

  const labels = {
    todo: t("status.todo"),
    doing: t("status.doing"),
    done: t("status.done"),
    addTask: t("tasks.addTask"),
    titlePlaceholder: t("tasks.titlePlaceholder"),
    showMore: t("common.showMore"),
    invited: t("teammate.invited"),
    inactive: t("teammate.inactive"),
    emptyBoard: t("tasks.emptyBoard"),
    emptyBoardHint: t("tasks.emptyBoardHint"),
    emptyBoardInvite: t("tasks.emptyBoardInvite"),
    newTask: t("common.newTask"),
    newTaskAi: t("tasks.composeAiOpen"),
    dueDate: t("tasks.dueDate"),
    overdue: t("tasks.overdue"),
    dragHandle: t("common.dragHandle"),
    addDueDate: t("tasks.addDueDate"),
    startDoing: t("tasks.startDoing"),
    startDoingShort: t("tasks.startDoingShort"),
    markDone: t("tasks.markDone"),
    markDoneShort: t("tasks.markDoneShort"),
    completedMark: t("tasks.completedMark"),
    taskMenu: t("tasks.taskMenu"),
    menuOpen: t("tasks.menuOpen"),
    menuClone: t("tasks.menuClone"),
    menuDelete: t("tasks.menuDelete"),
    deleteConfirm: t("tasks.deleteConfirm"),
    telegramFailed: t("tasks.telegramFailed"),
    project: t("tasks.project"),
    projectNone: t("tasks.projectNone"),
    projectScrollLeft: t("tasks.projectScrollLeft"),
    projectScrollRight: t("tasks.projectScrollRight"),
  };

  const composeLabels: ComposeDrawerLabels = {
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
    aiQuota: t("tasks.composeAiQuota"),
    closeConfirm: t("tasks.composeCloseConfirm"),
    errorSuggest: t("tasks.composeErrorSuggest"),
    errorApprove: t("tasks.composeErrorApprove"),
    errorQuota: t("tasks.composeErrorQuota"),
    errorRate: t("tasks.composeErrorRate"),
    errorTooLong: t("tasks.composeErrorTooLong"),
  };

  const assigneeOptions = workspace.members.map((member) => ({
    id: member.id,
    label:
      member.id === self.id
        ? t("tasks.assignToMe", { name: self.name })
        : member.name,
  }));

  const selfTasks = tasks.filter((task) => task.assigneeId === self.id);
  const scopedTasks = scope === "mine" ? selfTasks : tasks;
  const visibleTasks = project
    ? scopedTasks.filter((task) => task.projectId === project)
    : scopedTasks;
  const emptyMyWork = scope === "mine" && scopedTasks.length === 0;

  return (
    <>
      <div className="space-y-4">
        <div className={viewToggleStyles.toolbar}>
          <div className={viewToggleStyles.toolbarStart}>
            <div
              className={viewToggleStyles.toggleCluster}
              data-tour="demo-view-toggle"
            >
              <ScopeToggle
                value={scope}
                onChange={setScope}
                mineLabel={t("tasks.myWork")}
                teamLabel={t("tasks.team")}
                ariaLabel={t("tasks.scopeAria")}
              />
              <ViewToggle
                value={view}
                onChange={setBoardView}
                boardLabel={t("common.board")}
                listLabel={t("common.list")}
                ariaLabel={t("tasks.viewAria")}
              />
            </div>
            <ProjectSelect
              projects={openProjects}
              value={project}
              onChange={setProject}
              allLabel={t("tasks.filterAll")}
              projectLabel={t("tasks.project")}
              addProjectHref={`/${locale}/demo/app/projects`}
              addProjectLabel={t("tasks.addProject")}
            />
          </div>
          <div className={viewToggleStyles.newTaskWrap}>
            <Button
              type="button"
              className={buttonCompact}
              data-tour="demo-new-task"
              onClick={() => openCompose("manual")}
            >
              {t("common.newTask")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className={buttonCompact}
              data-tour="demo-new-task-ai"
              onClick={() => openCompose("ai")}
            >
              {t("tasks.composeAiOpen")}
            </Button>
          </div>
        </div>
        {emptyMyWork ? (
          <p className="tasks-no-select text-sm text-[var(--text-muted)]">
            {t("tasks.emptyMyWork")}
          </p>
        ) : view === "board" ? (
          <div data-tour="demo-board" className="min-h-0">
          {scope === "mine" ? (
            <StatusKanban
              tasks={visibleTasks}
              locale={locale}
              scope="mine"
              view="board"
              self={{ id: self.id, name: self.name }}
              getTaskHref={() => null}
              openProjects={boardProjects}
              labels={labels}
            />
          ) : (
            <TeamBoard
              self={{ id: self.id, name: self.name }}
              members={members}
              tasks={visibleTasks}
              locale={locale}
              scope="team"
              view="board"
              editMode="all"
              getTaskHref={() => null}
              linkMembers={false}
              openProjects={boardProjects}
              labels={labels}
            />
          )}
          </div>
        ) : (
          <div data-tour="demo-board">
          <TaskListWithFilters
            tasks={visibleTasks}
            locale={locale}
            scope={scope}
            view="list"
            project={project}
            openProjects={openProjects}
            currentUserId={self.id}
            canEditAll
            assigneeOptions={[
              { id: self.id, label: self.name },
              ...members.map((member) => ({
                id: member.id,
                label: member.name,
              })),
            ]}
            labels={{
              title: t("tasks.title"),
              assignee: t("tasks.assignee"),
              dueDate: t("tasks.dueDate"),
              addDueDate: t("tasks.addDueDate"),
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
              category: t("tasks.category"),
              projectNone: t("tasks.projectNone"),
              categoryNone: t("tasks.categoryNone"),
              menuOpen: t("tasks.menuOpen"),
              markDone: t("tasks.markDone"),
            }}
          />
          </div>
        )}
      </div>

      <DemoTutorial composeMode={composeMode} />

      {composeMode ? (
        <TaskComposeDrawer
          open
          mode={composeMode}
          onClose={() => setComposeMode(null)}
          locale={locale}
          isOperator
          aiEnabled
          aiRemaining={aiRemaining}
          aiLimit={DEMO_AI_LIMIT}
          selfId={self.id}
          defaultProjectId={project}
          assigneeOptions={assigneeOptions}
          openProjects={openProjects}
          labels={composeLabels}
          local={localAdapters}
          onCreated={() => {
            setComposeMode(null);
          }}
        />
      ) : null}
    </>
  );
}
