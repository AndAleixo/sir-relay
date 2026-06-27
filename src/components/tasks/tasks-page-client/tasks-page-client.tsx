"use client";

import { useEffect } from "react";
import type { Task, Teammate } from "@/domain/types";
import { useSync } from "@/components/sync";
import { StatusKanban } from "@/components/tasks/status-kanban";
import { TaskList } from "@/components/tasks/task-list";
import { TeammateBoard } from "@/components/tasks/teammate-board";
import { ViewToggle, type TasksView } from "@/components/tasks/view-toggle";
import { useState } from "react";

interface TasksPageClientProps {
  locale: string;
  role: "operator" | "teammate";
  tasks: Task[];
  teammates: Teammate[];
  labels: {
    board: string;
    list: string;
    myTasks: string;
    allTasks: string;
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
    dragHint: string;
    dragHandle: string;
    status: { todo: string; doing: string; done: string };
  };
}

export function TasksPageClient({
  locale,
  role,
  tasks: serverTasks,
  teammates,
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
      <ViewToggle
        value={view}
        onChange={setView}
        boardLabel={labels.board}
        listLabel={labels.list}
      />

      {view === "board" ? (
        isOperator ? (
          <TeammateBoard
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
              dragHint: labels.dragHint,
              dragHandle: labels.dragHandle,
            }}
          />
        ) : (
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
              dragHint: labels.dragHint,
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
