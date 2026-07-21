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
  BoardTaskCard,
  type TaskCardLabels,
} from "@/components/tasks/task-card";
import { BoardQuickAddTask } from "@/components/tasks/board-quick-add-task";
import { TodoReorderList, resolveTodoDropIndex } from "@/components/tasks/todo-reorder-list";
import { kanbanStyles } from "./status-kanban.styles";

interface StatusKanbanProps {
  tasks: Task[];
  locale: string;
  currentUser: { id: string; name: string };
  labels: TaskCardLabels & {
    todo: string;
    doing: string;
    done: string;
    dragHandle: string;
    openTask: string;
    addDueDate: string;
    startDoing: string;
    markDone: string;
    completedMark: string;
    addTask: string;
    titlePlaceholder: string;
  };
}

const columns: TaskStatus[] = ["todo", "doing", "done"];

export function StatusKanban({
  tasks,
  locale,
  currentUser,
  labels,
}: StatusKanbanProps) {
  const { applyTaskUpdate, createTaskQuick, placeInTodoQueue } = useSync();
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<TaskStatus | null>(
    null,
  );

  const grouped = groupTasksByStatusOrdered(tasks);
  const labelMap = { todo: labels.todo, doing: labels.doing, done: labels.done };

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
      tasks.find((t) => t.id === taskId)?.assigneeId ?? currentUser.id;

    await placeInTodoQueue(
      taskId,
      assigneeId,
      buildTodoQueueOrder(tasks, assigneeId, taskId, toIndex),
    );
  }

  async function assignStatus(taskId: string, targetStatus: TaskStatus) {
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

  async function handleUpdateFields(
    taskId: string,
    fields: { title?: string; dueDate?: string | null },
  ) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const patch: Partial<Task> = {
      ...(fields.title !== undefined ? { title: fields.title } : {}),
      ...(fields.dueDate !== undefined ? { dueDate: fields.dueDate } : {}),
    };
    if (Object.keys(patch).length === 0) return;

    await applyTaskUpdate(taskId, patch, [
      {
        type: "update_fields",
        taskId,
        payload: fields,
      },
    ]);
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

  const cardLabels = {
    dueDate: labels.dueDate,
    overdue: labels.overdue,
    dragHandle: labels.dragHandle,
    openTask: labels.openTask,
    addDueDate: labels.addDueDate,
    startDoing: labels.startDoing,
    markDone: labels.markDone,
    completedMark: labels.completedMark,
  };

  function renderCard(task: Task, status: TaskStatus, todoIndex?: number) {
    const isTodo = status === "todo";
    const isQueueHead = isTodo && todoIndex === 0;

    return (
      <BoardTaskCard
        task={task}
        locale={locale}
        href={`/${locale}/tasks/${task.id}`}
        labels={cardLabels}
        isDragging={draggingTaskId === task.id}
        isQueueHead={isQueueHead}
        showCompletedMark={status === "done"}
        onDragHandleStart={() => handleDragStart(task.id)}
        onDragHandleEnd={handleDragEnd}
        onUpdateFields={(fields) => handleUpdateFields(task.id, fields)}
        onStartDoing={
          isQueueHead ? () => void assignStatus(task.id, "doing") : undefined
        }
        onMarkDone={
          status === "doing" ? () => void assignStatus(task.id, "done") : undefined
        }
      />
    );
  }

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
                  node: renderCard(task, "todo", index),
                }))}
              />
            ) : (
              grouped[status].map((task) => (
                <div key={task.id}>{renderCard(task, status)}</div>
              ))
            )}
            {status === "todo" ? (
              <BoardQuickAddTask
                assigneeId={currentUser.id}
                assigneeName={currentUser.name}
                addLabel={labels.addTask}
                titlePlaceholder={labels.titlePlaceholder}
                onCreate={(input) => createTaskQuick(locale, input)}
              />
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
