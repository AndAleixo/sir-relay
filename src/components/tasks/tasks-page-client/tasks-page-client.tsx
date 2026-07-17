"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Task } from "@/domain/types";
import type { OrganizationUser } from "@/services/contracts";
import { groupMemberLabel } from "@/lib/group-member-label";
import { useSync } from "@/components/sync";
import { Button } from "@/components/ui/button";
import { StatusKanban } from "@/components/tasks/status-kanban";
import { TaskListWithFilters } from "@/components/tasks/task-list/task-list-with-filters";
import { TeammateBoard } from "@/components/tasks/teammate-board";
import { ViewToggle, type TasksView } from "@/components/tasks/view-toggle";
import { viewToggleStyles } from "@/components/tasks/view-toggle/view-toggle.styles";

interface TasksPageClientProps {
  locale: string;
  role: "operator" | "teammate";
  operator?: {
    id: string;
    name: string;
    email?: string;
    displayName?: string | null;
    telegramStatus?: "linked" | "pending";
  };
  tasks: Task[];
  members: OrganizationUser[];
  showNewTask?: boolean;
  labels: {
    board: string;
    list: string;
    newTask: string;
    assignee: string;
    dueDate: string;
    updated: string;
    overdue: string;
    emptyMine: string;
    emptyBoard: string;
    sectionTodo: string;
    sectionDoing: string;
    sectionDone: string;
    linked: string;
    pending: string;
    invited: string;
    active: string;
    operatorRole: string;
    viewAll: string;
    dragHandle: string;
    meColumn: string;
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
  operator,
  tasks: serverTasks,
  members,
  showNewTask = false,
  labels,
}: TasksPageClientProps) {
  const { tasks, syncFromServer } = useSync();
  const [view, setView] = useState<TasksView>("board");
  const isOperator = role === "operator";

  useEffect(() => {
    syncFromServer(serverTasks);
  }, [serverTasks, syncFromServer]);

  return (
    <div className="space-y-4">
      <div className={viewToggleStyles.toolbar}>
        <ViewToggle
          value={view}
          onChange={setView}
          boardLabel={labels.board}
          listLabel={labels.list}
        />
        {showNewTask ? (
          <Link href={`/${locale}/tasks/new`}>
            <Button>{labels.newTask}</Button>
          </Link>
        ) : null}
      </div>

      {view === "board" ? (
        isOperator && operator ? (
          <TeammateBoard
            operator={operator}
            members={members}
            tasks={tasks}
            locale={locale}
            labels={{
              sectionTodo: labels.sectionTodo,
              sectionDoing: labels.sectionDoing,
              sectionDone: labels.sectionDone,
              linked: labels.linked,
              pending: labels.pending,
              invited: labels.invited,
              active: labels.active,
              operatorRole: labels.operatorRole,
              dueDate: labels.dueDate,
              updated: labels.updated,
              overdue: labels.overdue,
              viewAll: labels.viewAll,
              emptyBoard: labels.emptyBoard,
              dragHandle: labels.dragHandle,
              meColumn: labels.meColumn,
              openTask: labels.openTask,
              addTask: labels.addTask,
              addDueDate: labels.addDueDate,
              titlePlaceholder: labels.titlePlaceholder,
            }}
          />
        ) : isOperator ? null : (
          <StatusKanban
            tasks={tasks}
            locale={locale}
            labels={{
              todo: labels.status.todo,
              doing: labels.status.doing,
              done: labels.status.done,
              dueDate: labels.dueDate,
              updated: labels.updated,
              overdue: labels.overdue,
              emptyMine: labels.emptyMine,
              dragHandle: labels.dragHandle,
            }}
          />
        )
      ) : isOperator && operator ? (
        <TaskListWithFilters
          tasks={tasks}
          locale={locale}
          assigneeOptions={[
            { id: operator.id, label: labels.meColumn },
            ...members.map((member) => ({
              id: member.id,
              label: groupMemberLabel(member),
            })),
          ]}
          labels={{
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
          }}
        />
      ) : (
        <TaskListWithFilters
          tasks={tasks}
          locale={locale}
          labels={{
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
          }}
        />
      )}
    </div>
  );
}
