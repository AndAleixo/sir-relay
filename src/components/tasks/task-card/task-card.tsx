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

export interface TaskCardLabels {
  dueDate: string;
  updated: string;
  overdue: string;
}

interface TaskCardContentProps {
  task: Task;
  locale: string;
  showAssignee?: boolean;
  labels: TaskCardLabels;
}

export function TaskCardContent({
  task,
  locale,
  showAssignee = false,
  labels,
}: TaskCardContentProps) {
  const overdue = isOverdue(task.dueDate);

  return (
    <>
      <div className={taskCardStyles.titleRow}>
        <h3 className={cn(taskCardStyles.title, "min-w-0 flex-1")}>{task.title}</h3>
      </div>
      {showAssignee && (
        <p className={cn(taskCardStyles.meta, "truncate")}>{task.assigneeName}</p>
      )}
      <div className={taskCardStyles.footer}>
        <span className={cn(taskCardStyles.dueButton, overdue && taskCardStyles.overdue)}>
          {labels.dueDate}: {formatDueDate(task.dueDate, locale)}
          {overdue && ` · ${labels.overdue}`}
        </span>
      </div>
      {task.telegramNotifyFailed && (
        <span
          className={taskCardStyles.notifyDotCorner}
          title="Telegram delivery failed"
        />
      )}
    </>
  );
}

interface DraggableTaskCardProps extends TaskCardContentProps {
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
  ...contentProps
}: DraggableTaskCardProps) {
  function handleDragStart(event: DragEvent<HTMLButtonElement>) {
    setTaskDragData(event, contentProps.task.id);
    onDragHandleStart(event);
  }

  const overdue = isOverdue(contentProps.task.dueDate);

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
        <Link href={href} className={taskCardStyles.cardLink} draggable={false}>
          <div className={taskCardStyles.titleRow}>
            <h3 className={cn(taskCardStyles.title, "min-w-0 flex-1")}>
              {contentProps.task.title}
            </h3>
          </div>
          {contentProps.showAssignee && (
            <p className={cn(taskCardStyles.meta, "truncate")}>
              {contentProps.task.assigneeName}
            </p>
          )}
        </Link>
        <div
          className={cn(
            taskCardStyles.footer,
            contentProps.task.telegramNotifyFailed && "pr-3",
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
            {contentProps.labels.dueDate}:{" "}
            {formatDueDate(contentProps.task.dueDate, contentProps.locale)}
            {overdue && ` · ${contentProps.labels.overdue}`}
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
        {contentProps.task.telegramNotifyFailed && (
          <span
            className={taskCardStyles.notifyDotCorner}
            title="Telegram delivery failed"
          />
        )}
      </div>
    </div>
  );
}
