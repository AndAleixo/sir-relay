"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Task } from "@/domain/types";
import type { OrganizationUser } from "@/services/contracts";
import { groupMemberLabel } from "@/lib/group-member-label";
import { useSync } from "@/components/sync";
import { Button } from "@/components/ui/button";
import { StatusKanban } from "@/components/tasks/status-kanban";
import { TaskListWithFilters } from "@/components/tasks/task-list/task-list-with-filters";
import { TeamBoard } from "@/components/tasks/team-board";
import {
  ScopeToggle,
  ViewToggle,
  type TasksScope,
  type TasksView,
} from "@/components/tasks/view-toggle";
import { viewToggleStyles } from "@/components/tasks/view-toggle/view-toggle.styles";

interface TasksPageClientProps {
  locale: string;
  role: "operator" | "teammate";
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
    newTask: string;
    assignee: string;
    dueDate: string;
    updated: string;
    overdue: string;
    emptyBoard: string;
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
    openTask: string;
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
    status: { todo: string; doing: string; done: string };
  };
}

export function TasksPageClient({
  locale,
  role,
  self,
  tasks: serverTasks,
  members,
  labels,
}: TasksPageClientProps) {
  const { tasks, syncFromServer } = useSync();
  const [view, setView] = useState<TasksView>("board");
  const [scope, setScope] = useState<TasksScope>(
    role === "operator" ? "team" : "mine",
  );
  const isOperator = role === "operator";

  useEffect(() => {
    syncFromServer(serverTasks);
  }, [serverTasks, syncFromServer]);

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
    openTask: labels.openTask,
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
    status: labels.status,
  };

  const kanbanLabels = {
    todo: labels.status.todo,
    doing: labels.status.doing,
    done: labels.status.done,
    dueDate: labels.dueDate,
    overdue: labels.overdue,
    dragHandle: labels.dragHandle,
    openTask: labels.openTask,
    addDueDate: labels.addDueDate,
    startDoing: labels.startDoing,
    markDone: labels.markDone,
    completedMark: labels.completedMark,
    addTask: labels.addTask,
    titlePlaceholder: labels.titlePlaceholder,
  };

  return (
    <div className="space-y-4">
      <div className={viewToggleStyles.toolbar}>
        <div className={viewToggleStyles.toolbarStart}>
          <ScopeToggle
            value={scope}
            onChange={setScope}
            mineLabel={labels.myWork}
            teamLabel={labels.team}
          />
          <ViewToggle
            value={view}
            onChange={setView}
            boardLabel={labels.board}
            listLabel={labels.list}
          />
        </div>
        <Link href={`/${locale}/tasks/new`}>
          <Button>{labels.newTask}</Button>
        </Link>
      </div>

      {view === "board" ? (
        scope === "team" ? (
          <TeamBoard
            self={self}
            members={members}
            tasks={scopedTasks}
            locale={locale}
            editMode={isOperator ? "all" : "self-only"}
            linkMemberProfiles={isOperator}
            labels={boardLabels}
          />
        ) : (
          <StatusKanban
            tasks={scopedTasks}
            locale={locale}
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
          assigneeOptions={scope === "team" ? assigneeOptions : []}
          labels={listLabels}
        />
      )}
    </div>
  );
}
