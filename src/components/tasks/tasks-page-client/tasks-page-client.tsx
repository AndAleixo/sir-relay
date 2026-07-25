"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Task } from "@/domain/types";
import type { OrganizationUser } from "@/services/contracts";
import { groupMemberLabel } from "@/lib/group-member-label";
import type { TasksScope, TasksView } from "@/lib/tasks-url";
import { taskNewHref, tasksListHref } from "@/lib/tasks-url";
import { useSync } from "@/components/sync";
import { Button } from "@/components/ui/button";
import { StatusKanban } from "@/components/tasks/status-kanban";
import { TaskListWithFilters } from "@/components/tasks/task-list/task-list-with-filters";
import { TeamBoard } from "@/components/tasks/team-board";
import { ScopeToggle, ViewToggle } from "@/components/tasks/view-toggle";
import { viewToggleStyles } from "@/components/tasks/view-toggle/view-toggle.styles";

interface TasksPageClientProps {
  locale: string;
  role: "operator" | "teammate";
  initialScope: TasksScope;
  initialView: TasksView;
  /** Signed-in user for Team board self column + My work Kanban. */
  self: {
    id: string;
    name: string;
    email?: string;
    displayName?: string | null;
    telegramStatus?: "linked" | "pending";
  };
  tasks: Task[];
  /** Other members already ordered at page load (Team board). */
  members: OrganizationUser[];
  labels: {
    board: string;
    list: string;
    myWork: string;
    team: string;
    scopeAria: string;
    newTask: string;
    assignee: string;
    dueDate: string;
    updated: string;
    overdue: string;
    emptyBoard: string;
    emptyMyWork: string;
    sectionTodo: string;
    sectionDoing: string;
    sectionDone: string;
    startDoing: string;
    markDone: string;
    completedMark: string;
    linked: string;
    pending: string;
    invited: string;
    inactive: string;
    showMore: string;
    dragHandle: string;
    taskMenu: string;
    menuOpen: string;
    menuClone: string;
    menuDelete: string;
    deleteConfirm: string;
    addTask: string;
    addDueDate: string;
    titlePlaceholder: string;
    titleColumn: string;
    filterAssignee: string;
    filterStatus: string;
    filterSort: string;
    filterAll: string;
    sortDue: string;
    sortStatus: string;
    sortUpdated: string;
    statusColumn: string;
    status: { todo: string; doing: string; done: string };
  };
}

export function TasksPageClient({
  locale,
  role,
  initialScope,
  initialView,
  self,
  tasks: serverTasks,
  members,
  labels,
}: TasksPageClientProps) {
  const router = useRouter();
  const { tasks, syncFromServer } = useSync();
  const [view, setViewState] = useState<TasksView>(initialView);
  const [scope, setScopeState] = useState<TasksScope>(initialScope);
  const isOperator = role === "operator";

  useEffect(() => {
    setScopeState(initialScope);
  }, [initialScope]);

  useEffect(() => {
    setViewState(initialView);
  }, [initialView]);

  useEffect(() => {
    syncFromServer(serverTasks);
  }, [serverTasks, syncFromServer]);

  function setScope(next: TasksScope) {
    setScopeState(next);
    router.replace(tasksListHref(locale, { scope: next, view }), {
      scroll: false,
    });
  }

  function setView(next: TasksView) {
    setViewState(next);
    router.replace(tasksListHref(locale, { scope, view: next }), {
      scroll: false,
    });
  }

  const scopedTasks = useMemo(() => {
    if (scope === "mine") {
      return tasks.filter((task) => task.assigneeId === self.id);
    }
    return tasks;
  }, [tasks, scope, self.id]);

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
      ...members.map((member) => ({
        id: member.id,
        label: groupMemberLabel(member),
      })),
    ],
    [self, members],
  );

  const boardLabels = {
    sectionTodo: labels.sectionTodo,
    sectionDoing: labels.sectionDoing,
    sectionDone: labels.sectionDone,
    startDoing: labels.startDoing,
    markDone: labels.markDone,
    completedMark: labels.completedMark,
    linked: labels.linked,
    pending: labels.pending,
    invited: labels.invited,
    inactive: labels.inactive,
    dueDate: labels.dueDate,
    overdue: labels.overdue,
    showMore: labels.showMore,
    emptyBoard: labels.emptyBoard,
    dragHandle: labels.dragHandle,
    taskMenu: labels.taskMenu,
    menuOpen: labels.menuOpen,
    menuClone: labels.menuClone,
    menuDelete: labels.menuDelete,
    deleteConfirm: labels.deleteConfirm,
    addTask: labels.addTask,
    addDueDate: labels.addDueDate,
    titlePlaceholder: labels.titlePlaceholder,
  };

  const listLabels = {
    titleColumn: labels.titleColumn,
    assignee: labels.assignee,
    dueDate: labels.dueDate,
    updated: labels.updated,
    overdue: labels.overdue,
    filterAssignee: labels.filterAssignee,
    filterStatus: labels.filterStatus,
    filterSort: labels.filterSort,
    filterAll: labels.filterAll,
    sortDue: labels.sortDue,
    sortStatus: labels.sortStatus,
    sortUpdated: labels.sortUpdated,
    statusColumn: labels.statusColumn,
    status: labels.status,
  };

  const kanbanLabels = {
    todo: labels.status.todo,
    doing: labels.status.doing,
    done: labels.status.done,
    dueDate: labels.dueDate,
    overdue: labels.overdue,
    dragHandle: labels.dragHandle,
    addDueDate: labels.addDueDate,
    startDoing: labels.startDoing,
    markDone: labels.markDone,
    completedMark: labels.completedMark,
    addTask: labels.addTask,
    titlePlaceholder: labels.titlePlaceholder,
    showMore: labels.showMore,
    taskMenu: labels.taskMenu,
    menuOpen: labels.menuOpen,
    menuClone: labels.menuClone,
    menuDelete: labels.menuDelete,
    deleteConfirm: labels.deleteConfirm,
  };

  const emptyMyWork = scope === "mine" && scopedTasks.length === 0;

  return (
    <div className="space-y-4">
      <div className={viewToggleStyles.toolbar}>
        <div className={viewToggleStyles.toolbarStart}>
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
          />
        </div>
        <Link href={taskNewHref(locale, { scope, view })}>
          <Button>{labels.newTask}</Button>
        </Link>
      </div>

      {emptyMyWork ? (
        <p className="text-sm text-[var(--text-muted)]">{labels.emptyMyWork}</p>
      ) : view === "board" ? (
        scope === "team" ? (
          <TeamBoard
            self={self}
            members={members}
            tasks={scopedTasks}
            locale={locale}
            scope={scope}
            view={view}
            editMode={isOperator ? "all" : "self-only"}
            linkMemberProfiles={isOperator}
            labels={boardLabels}
          />
        ) : (
          <StatusKanban
            tasks={scopedTasks}
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
          />
        )
      ) : (
        <TaskListWithFilters
          tasks={scopedTasks}
          locale={locale}
          scope={scope}
          view={view}
          assigneeOptions={scope === "team" ? assigneeOptions : []}
          labels={listLabels}
        />
      )}
    </div>
  );
}
