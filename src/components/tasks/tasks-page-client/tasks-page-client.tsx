"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ManagedProject, Task } from "@/domain/types";
import type { OrganizationUser } from "@/services/contracts";
import { groupMemberLabel } from "@/lib/group-member-label";
import type { TasksScope, TasksView } from "@/lib/tasks-url";
import { taskNewHref, tasksListHref } from "@/lib/tasks-url";
import { useSync } from "@/components/sync";
import { Button } from "@/components/ui/button";
import type { TaskCardLabels } from "@/components/tasks/task-card";
import { StatusKanban } from "@/components/tasks/status-kanban";
import { TaskListWithFilters } from "@/components/tasks/task-list/task-list-with-filters";
import { TeamBoard } from "@/components/tasks/team-board";
import {
  ProjectSelect,
  ScopeToggle,
  ViewToggle,
} from "@/components/tasks/view-toggle";
import { viewToggleStyles } from "@/components/tasks/view-toggle/view-toggle.styles";

interface TasksPageClientProps {
  locale: string;
  role: "operator" | "teammate";
  initialScope: TasksScope;
  initialView: TasksView;
  initialProject: string | null;
  openProjects: ManagedProject[];
  /** Signed-in user for Team board self column + My work Kanban. */
  self: {
    id: string;
    name: string;
    email?: string;
    displayName?: string | null;
    telegramStatus?: "linked" | "pending";
  };
  tasks: Task[];
  /** Other members ordered at Tasks open (Team board; keep via useState). */
  members: OrganizationUser[];
  labels: TaskCardLabels & {
    board: string;
    list: string;
    myWork: string;
    team: string;
    scopeAria: string;
    viewAria: string;
    newTask: string;
    assignee: string;
    updated: string;
    emptyBoard: string;
    emptyMyWork: string;
    linked: string;
    pending: string;
    invited: string;
    inactive: string;
    showMore: string;
    addTask: string;
    titlePlaceholder: string;
    title: string;
    filterAssignee: string;
    filterStatus: string;
    filterSort: string;
    filterAll: string;
    sortDue: string;
    sortUpdated: string;
    statusColumn: string;
    status: { todo: string; doing: string; done: string };
    addProject: string;
    category: string;
    categoryNone: string;
  };
}

export function TasksPageClient({
  locale,
  role,
  initialScope,
  initialView,
  initialProject,
  openProjects,
  self,
  tasks: serverTasks,
  members,
  labels,
}: TasksPageClientProps) {
  const router = useRouter();
  const { tasks, syncFromServer } = useSync();
  const [view, setViewState] = useState<TasksView>(initialView);
  const [scope, setScopeState] = useState<TasksScope>(initialScope);
  const [project, setProjectState] = useState<string | null>(initialProject);
  /** Order fixed when Tasks opens — not updated when server revalidates. */
  const [boardMembers] = useState(members);
  const isOperator = role === "operator";

  useEffect(() => {
    setScopeState(initialScope);
  }, [initialScope]);

  useEffect(() => {
    setViewState(initialView);
  }, [initialView]);

  useEffect(() => {
    setProjectState(initialProject);
  }, [initialProject]);

  useEffect(() => {
    syncFromServer(serverTasks);
  }, [serverTasks, syncFromServer]);

  function hrefOpts(next?: {
    scope?: TasksScope;
    view?: TasksView;
    project?: string | null;
  }) {
    return {
      scope: next?.scope ?? scope,
      view: next?.view ?? view,
      project: next?.project !== undefined ? next.project : project,
    };
  }

  function setScope(next: TasksScope) {
    setScopeState(next);
    router.replace(tasksListHref(locale, hrefOpts({ scope: next })), {
      scroll: false,
    });
  }

  function setView(next: TasksView) {
    setViewState(next);
    router.replace(tasksListHref(locale, hrefOpts({ view: next })), {
      scroll: false,
    });
  }

  function setProject(next: string | null) {
    setProjectState(next);
    router.replace(tasksListHref(locale, hrefOpts({ project: next })), {
      scroll: false,
    });
  }

  const scopedTasks = useMemo(() => {
    if (scope === "mine") {
      return tasks.filter((task) => task.assigneeId === self.id);
    }
    return tasks;
  }, [tasks, scope, self.id]);

  const visibleTasks = useMemo(() => {
    if (!project) return scopedTasks;
    return scopedTasks.filter((task) => task.projectId === project);
  }, [scopedTasks, project]);

  const assigneeOptions = useMemo(
    () => [
      {
        id: self.id,
        label: groupMemberLabel({
          name: self.name,
          email: self.email ?? "",
          displayName: self.displayName,
        }),
      },
      ...boardMembers.map((member) => ({
        id: member.id,
        label: groupMemberLabel(member),
      })),
    ],
    [self, boardMembers],
  );

  const cardLabels: TaskCardLabels = {
    dueDate: labels.dueDate,
    overdue: labels.overdue,
    dragHandle: labels.dragHandle,
    addDueDate: labels.addDueDate,
    startDoing: labels.startDoing,
    markDone: labels.markDone,
    completedMark: labels.completedMark,
    taskMenu: labels.taskMenu,
    menuOpen: labels.menuOpen,
    menuClone: labels.menuClone,
    menuDelete: labels.menuDelete,
    deleteConfirm: labels.deleteConfirm,
    telegramFailed: labels.telegramFailed,
    project: labels.project,
    projectNone: labels.projectNone,
    projectScrollLeft: labels.projectScrollLeft,
    projectScrollRight: labels.projectScrollRight,
  };

  const boardLabels = {
    ...cardLabels,
    todo: labels.status.todo,
    doing: labels.status.doing,
    done: labels.status.done,
    linked: labels.linked,
    pending: labels.pending,
    invited: labels.invited,
    inactive: labels.inactive,
    showMore: labels.showMore,
    emptyBoard: labels.emptyBoard,
    addTask: labels.addTask,
    titlePlaceholder: labels.titlePlaceholder,
  };

  const kanbanLabels = {
    ...cardLabels,
    todo: labels.status.todo,
    doing: labels.status.doing,
    done: labels.status.done,
    addTask: labels.addTask,
    titlePlaceholder: labels.titlePlaceholder,
    showMore: labels.showMore,
  };

  const listLabels = {
    title: labels.title,
    assignee: labels.assignee,
    dueDate: labels.dueDate,
    addDueDate: labels.addDueDate,
    filterAssignee: labels.filterAssignee,
    filterStatus: labels.filterStatus,
    filterSort: labels.filterSort,
    filterAll: labels.filterAll,
    sortDue: labels.sortDue,
    sortUpdated: labels.sortUpdated,
    statusColumn: labels.statusColumn,
    status: labels.status,
    project: labels.project,
    category: labels.category,
    projectNone: labels.projectNone,
    categoryNone: labels.categoryNone,
  };

  const emptyMyWork = scope === "mine" && scopedTasks.length === 0;

  return (
    <div className="space-y-4">
      <div className={viewToggleStyles.toolbar}>
        <div className={viewToggleStyles.toolbarStart}>
          <div className={viewToggleStyles.toggleCluster}>
            <ScopeToggle
              value={scope}
              onChange={setScope}
              mineLabel={labels.myWork}
              teamLabel={labels.team}
              ariaLabel={labels.scopeAria}
            />
            <ViewToggle
              value={view}
              onChange={setView}
              boardLabel={labels.board}
              listLabel={labels.list}
              ariaLabel={labels.viewAria}
            />
          </div>
          <ProjectSelect
            projects={openProjects}
            value={project}
            onChange={setProject}
            allLabel={labels.filterAll}
            projectLabel={labels.project}
            addProjectHref={`/${locale}/projects`}
            addProjectLabel={labels.addProject}
          />
        </div>
        <Link
          href={taskNewHref(locale, {
            scope,
            view,
            project,
          })}
          className={viewToggleStyles.newTaskWrap}
        >
          <Button className={viewToggleStyles.newTask}>{labels.newTask}</Button>
        </Link>
      </div>

      {emptyMyWork ? (
        <p className="text-sm text-[var(--text-muted)]">{labels.emptyMyWork}</p>
      ) : view === "board" ? (
        scope === "team" ? (
          <TeamBoard
            self={self}
            members={boardMembers}
            tasks={visibleTasks}
            locale={locale}
            scope={scope}
            view={view}
            editMode={isOperator ? "all" : "self-only"}
            labels={boardLabels}
            openProjects={openProjects}
          />
        ) : (
          <StatusKanban
            tasks={visibleTasks}
            locale={locale}
            scope={scope}
            view={view}
            self={{
              id: self.id,
              name: groupMemberLabel({
                name: self.name,
                email: self.email ?? "",
                displayName: self.displayName,
              }),
            }}
            labels={kanbanLabels}
            openProjects={openProjects}
          />
        )
      ) : (
        <TaskListWithFilters
          tasks={visibleTasks}
          locale={locale}
          scope={scope}
          view={view}
          project={project}
          openProjects={openProjects}
          currentUserId={self.id}
          canEditAll={isOperator}
          assigneeOptions={assigneeOptions}
          labels={listLabels}
        />
      )}
    </div>
  );
}
