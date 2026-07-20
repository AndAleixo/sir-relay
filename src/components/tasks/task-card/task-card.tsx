"use client";

import Link from "next/link";
import type { DragEvent } from "react";
import type { Task } from "@/domain/types";
import { cn } from "@/lib/cn";
import { formatDueDate, isOverdue } from "@/lib/dates";
import { setTaskDragData } from "@/lib/task-drag";
import { taskCardStyles } from "./task-card.styles";
import { StartDoingIcon } from "./start-doing-icon";
import { MarkDoneIcon } from "./mark-done-icon";
import { OpenTaskIcon } from "./open-task-icon";

export interface TaskCardLabels {
  dueDate: string;
  overdue: string;
}

interface DraggableTaskCardProps {
  task: Task;
  locale: string;
  showAssignee?: boolean;
  labels: TaskCardLabels & { openTask: string };
  href: string;
  dragHandleLabel: string;
  isDragging?: boolean;
  isQueueHead?: boolean;
  showCompletedMark?: boolean;
  startDoingLabel?: string;
  markDoneLabel?: string;
  completedMarkLabel?: string;
  onStartDoing?: () => void;
  onMarkDone?: () => void;
  onDragHandleStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragHandleEnd: () => void;
}

export function DraggableTaskCard({
  task,
  locale,
  showAssignee = false,
  labels,
  href,
  dragHandleLabel,
  isDragging,
  isQueueHead,
  showCompletedMark,
  startDoingLabel,
  markDoneLabel,
  completedMarkLabel,
  onStartDoing,
  onMarkDone,
  onDragHandleStart,
  onDragHandleEnd,
}: DraggableTaskCardProps) {
  function handleDragStart(event: DragEvent<HTMLButtonElement>) {
    setTaskDragData(event, task.id);
    onDragHandleStart(event);
  }

  const overdue = isOverdue(task.dueDate);

  return (
    <div
      className={cn(
        taskCardStyles.root,
        taskCardStyles.draggable,
        isDragging && taskCardStyles.dragging,
      )}
    >
      <button
        type="button"
        draggable
        data-no-drag-scroll
        className={taskCardStyles.dragHandle}
        aria-label={dragHandleLabel}
        onDragStart={handleDragStart}
        onDragEnd={onDragHandleEnd}
      >
        ⠿
      </button>
      <div className={taskCardStyles.boardBody}>
        <div className={taskCardStyles.titleRow}>
          <Link
            href={href}
            className={cn(taskCardStyles.titleButton, "min-w-0")}
            draggable={false}
          >
            {task.title}
          </Link>
          <Link
            href={href}
            className={taskCardStyles.openLink}
            aria-label={labels.openTask}
            title={labels.openTask}
            draggable={false}
          >
            <OpenTaskIcon />
          </Link>
        </div>
        {showAssignee ? (
          <p className={cn(taskCardStyles.meta, "truncate")}>{task.assigneeName}</p>
        ) : null}
        <div
          className={cn(
            taskCardStyles.footer,
            task.telegramNotifyFailed && "pr-3",
          )}
        >
          <Link
            href={href}
            className={cn(
              taskCardStyles.dueButton,
              "min-w-0 flex-1",
              overdue && taskCardStyles.overdue,
            )}
            draggable={false}
          >
            {labels.dueDate}: {formatDueDate(task.dueDate, locale)}
            {overdue && ` · ${labels.overdue}`}
          </Link>
          {isQueueHead && onStartDoing && startDoingLabel ? (
            <button
              type="button"
              className={taskCardStyles.startDoing}
              aria-label={startDoingLabel}
              title={startDoingLabel}
              onClick={onStartDoing}
            >
              <StartDoingIcon />
            </button>
          ) : onMarkDone && markDoneLabel ? (
            <button
              type="button"
              className={taskCardStyles.markDone}
              aria-label={markDoneLabel}
              title={markDoneLabel}
              onClick={onMarkDone}
            >
              <MarkDoneIcon />
            </button>
          ) : showCompletedMark ? (
            <span
              className={taskCardStyles.completedMark}
              title={completedMarkLabel}
              aria-label={completedMarkLabel}
            >
              <MarkDoneIcon />
            </span>
          ) : null}
        </div>
        {task.telegramNotifyFailed ? (
          <span
            className={taskCardStyles.notifyDotCorner}
            title="Telegram delivery failed"
          />
        ) : null}
      </div>
    </div>
  );
}
