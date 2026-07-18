"use client";

import { useState } from "react";
import type { DragEvent } from "react";
import type { Task, TaskStatus } from "@/domain/types";
import { cn } from "@/lib/cn";
import {
  clearTaskDragData,
  getTaskIdFromDragEvent,
} from "@/lib/task-drag";
import {
  buildTodoQueueOrder,
  groupTasksByStatusOrdered,
  TODO_QUEUE_APPEND,
} from "@/lib/task-queue";
import type { MutationInput } from "@/domain/sync";
import { useSync } from "@/components/sync";
import {
  DraggableTaskCard,
  type TaskCardLabels,
} from "@/components/tasks/task-card";
import { TodoReorderList, resolveTodoDropIndex } from "@/components/tasks/todo-reorder-list";
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
    startDoing: string;
  };
}

const columns: TaskStatus[] = ["todo", "doing", "done"];

export function StatusKanban({
  tasks,
  locale,
  labels,
}: StatusKanbanProps) {
  const { applyTaskUpdate, placeInTodoQueue } = useSync();
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<TaskStatus | null>(
    null,
  );

  const grouped = groupTasksByStatusOrdered(tasks);
  const labelMap = { todo: labels.todo, doing: labels.doing, done: labels.done };
  const selfId = tasks[0]?.assigneeId;

  function handleDragStart(taskId: string) {
    setDraggingTaskId(taskId);
  }

  function handleDragEnd() {
    setDraggingTaskId(null);
    setActiveDropTarget(null);
    clearTaskDragData();
  }

  async function placeInTodo(taskId: string, toIndex: number) {
    handleDragEnd();
    const assigneeId =
      tasks.find((t) => t.id === taskId)?.assigneeId ?? selfId;
    if (!assigneeId) return;

    await placeInTodoQueue(
      taskId,
      assigneeId,
      buildTodoQueueOrder(tasks, assigneeId, taskId, toIndex),
    );
  }

  async function assignStatus(taskId: string, targetStatus: TaskStatus) {
    if (targetStatus === "todo") {
      await placeInTodo(taskId, TODO_QUEUE_APPEND);
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    await applyTaskUpdate(
      taskId,
      { status: targetStatus },
      [
        {
          type: "update_status",
          taskId,
          payload: { status: targetStatus },
        } satisfies MutationInput,
      ],
    );
  }

  async function handleColumnDrop(
    targetStatus: TaskStatus,
    event: DragEvent<HTMLElement>,
  ) {
    const taskId = getTaskIdFromDragEvent(event);
    handleDragEnd();
    if (!taskId) return;

    if (targetStatus === "todo") {
      await placeInTodo(
        taskId,
        resolveTodoDropIndex(event, taskId, TODO_QUEUE_APPEND),
      );
      return;
    }

    await assignStatus(taskId, targetStatus);
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
          <div
            className={cn(kanbanStyles.cardList, "min-h-0 flex-1 overflow-y-auto")}
            data-todo-scroll={status === "todo" ? "" : undefined}
          >
            {status === "todo" ? (
              <TodoReorderList
                draggingTaskId={draggingTaskId}
                onPlace={placeInTodo}
                items={grouped.todo.map((task, index) => ({
                  id: task.id,
                  node: (
                    <DraggableTaskCard
                      task={task}
                      locale={locale}
                      href={`/${locale}/tasks/${task.id}`}
                      labels={cardLabels}
                      dragHandleLabel={labels.dragHandle}
                      isDragging={draggingTaskId === task.id}
                      isQueueHead={index === 0}
                      startDoingLabel={labels.startDoing}
                      onStartDoing={
                        index === 0
                          ? () => void assignStatus(task.id, "doing")
                          : undefined
                      }
                      onDragHandleStart={() => handleDragStart(task.id)}
                      onDragHandleEnd={handleDragEnd}
                    />
                  ),
                }))}
              />
            ) : (
              grouped[status].map((task) => (
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
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
