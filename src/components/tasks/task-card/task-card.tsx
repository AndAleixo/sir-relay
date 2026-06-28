"use client";

import Link from "next/link";
import type { DragEvent } from "react";
import type { Task } from "@/domain/types";
import { cn } from "@/lib/cn";
import { formatDueDate, formatRelativeTime, isOverdue } from "@/lib/dates";
import { setTaskDragData } from "@/lib/task-drag";
import { taskCardStyles } from "./task-card.styles";

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
        <span className={taskCardStyles.meta}>
          {formatRelativeTime(task.updatedAt, locale)}
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

interface TaskCardProps extends TaskCardContentProps {
  href: string;
}

export function TaskCard({ href, ...contentProps }: TaskCardProps) {
  return (
    <Link href={href} className={cn(taskCardStyles.root, taskCardStyles.hover)}>
      <TaskCardContent {...contentProps} />
    </Link>
  );
}

interface DraggableTaskCardProps extends TaskCardContentProps {
  href: string;
  dragHandleLabel: string;
  isDragging?: boolean;
  onDragHandleStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragHandleEnd: () => void;
}

export function DraggableTaskCard({
  href,
  dragHandleLabel,
  isDragging,
  onDragHandleStart,
  onDragHandleEnd,
  ...contentProps
}: DraggableTaskCardProps) {
  function handleDragStart(event: DragEvent<HTMLButtonElement>) {
    setTaskDragData(event, contentProps.task.id);
    onDragHandleStart(event);
  }

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
      <Link href={href} className={taskCardStyles.cardLink} draggable={false}>
        <TaskCardContent {...contentProps} />
      </Link>
    </div>
  );
}
