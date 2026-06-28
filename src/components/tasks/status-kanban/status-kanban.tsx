"use client";

import { useState } from "react";
import type { DragEvent } from "react";
import type { Task, TaskStatus } from "@/domain/types";
import { groupTasksByStatus } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { getTaskIdFromDragEvent } from "@/lib/task-drag";
import type { MutationInput } from "@/domain/sync";
import { useSync } from "@/components/sync";
import {
  DraggableTaskCard,
  type TaskCardLabels,
} from "@/components/tasks/task-card";
import { kanbanStyles } from "./status-kanban.styles";

interface StatusKanbanProps {
  tasks: Task[];
  locale: string;
  labels: TaskCardLabels & {
    todo: string;
    doing: string;
    done: string;
    emptyMine: string;
    dragHandle: string;
  };
}

const columns: TaskStatus[] = ["todo", "doing", "done"];

export function StatusKanban({
  tasks,
  locale,
  labels,
}: StatusKanbanProps) {
  const { applyTaskUpdate } = useSync();
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<TaskStatus | null>(
    null,
  );

  const grouped = groupTasksByStatus(tasks);
  const labelMap = { todo: labels.todo, doing: labels.doing, done: labels.done };

  function handleDragStart(taskId: string) {
    setDraggingTaskId(taskId);
  }

  function handleDragEnd() {
    setDraggingTaskId(null);
    setActiveDropTarget(null);
  }

  async function handleColumnDrop(
    targetStatus: TaskStatus,
    event: DragEvent<HTMLElement>,
  ) {
    const taskId = getTaskIdFromDragEvent(event);
    handleDragEnd();

    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    const mutations: MutationInput[] = [
      {
        type: "update_status",
        taskId,
        payload: { status: targetStatus },
      },
    ];

    await applyTaskUpdate(taskId, { status: targetStatus }, mutations);
  }

  if (tasks.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-[var(--border)] bg-surface-card p-8 text-center text-sm text-[var(--text-muted)]">
        {labels.emptyMine}
      </p>
    );
  }

  const cardLabels: TaskCardLabels & { dragHandle: string } = {
    dueDate: labels.dueDate,
    updated: labels.updated,
    overdue: labels.overdue,
    dragHandle: labels.dragHandle,
  };

  return (
    <div className={kanbanStyles.grid}>
      {columns.map((status) => (
        <section
          key={status}
          className={cn(
            kanbanStyles.column,
            activeDropTarget === status && kanbanStyles.columnDropTarget,
          )}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setActiveDropTarget(status);
          }}
          onDrop={(event) => {
            event.preventDefault();
            handleColumnDrop(status, event);
          }}
        >
          <header className={kanbanStyles.columnHeader[status]}>
            <h2 className={kanbanStyles.columnTitle}>{labelMap[status]}</h2>
            <span className={kanbanStyles.count}>{grouped[status].length}</span>
          </header>
          <div className={kanbanStyles.cardList}>
            {grouped[status].map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                locale={locale}
                href={`/${locale}/tasks/${task.id}`}
                labels={cardLabels}
                dragHandleLabel={labels.dragHandle}
                isDragging={draggingTaskId === task.id}
                onDragHandleStart={() => handleDragStart(task.id)}
                onDragHandleEnd={handleDragEnd}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
