"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Task, Teammate } from "@/domain/types";
import { useSync } from "@/components/sync";
import { Button } from "@/components/ui/button";
import { StatusKanban } from "@/components/tasks/status-kanban";
import { TaskList } from "@/components/tasks/task-list";
import { TeammateBoard } from "@/components/tasks/teammate-board";
import { ViewToggle, type TasksView } from "@/components/tasks/view-toggle";
import { viewToggleStyles } from "@/components/tasks/view-toggle/view-toggle.styles";

interface TasksPageClientProps {
  locale: string;
  role: "operator" | "teammate";
  operator?: { id: string; name: string };
  tasks: Task[];
  teammates: Teammate[];
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
    viewAll: string;
    dragHandle: string;
    meColumn: string;
    webOnly: string;
    openTask: string;
    addTask: string;
    addDueDate: string;
    titlePlaceholder: string;
    status: { todo: string; doing: string; done: string };
  };
}

export function TasksPageClient({
  locale,
  role,
  operator,
  tasks: serverTasks,
  teammates,
  showNewTask = false,
  labels,
}: TasksPageClientProps) {
  const { tasks, loadServerTasksIfEmpty } = useSync();
  const [view, setView] = useState<TasksView>("board");
  const isOperator = role === "operator";

  useEffect(() => {
    loadServerTasksIfEmpty(serverTasks);
  }, [serverTasks, loadServerTasksIfEmpty]);

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
            teammates={teammates}
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
              dueDate: labels.dueDate,
              updated: labels.updated,
              overdue: labels.overdue,
              viewAll: labels.viewAll,
              emptyBoard: labels.emptyBoard,
              dragHandle: labels.dragHandle,
              meColumn: labels.meColumn,
              webOnly: labels.webOnly,
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
      ) : (
        <TaskList
          tasks={tasks}
          locale={locale}
          showAssignee={isOperator}
          labels={{
            assignee: labels.assignee,
            dueDate: labels.dueDate,
            updated: labels.updated,
            overdue: labels.overdue,
            status: labels.status,
          }}
        />
      )}
    </div>
  );
}
