"use client";

import Link from "next/link";
import { useEffect, useState, type DragEvent } from "react";
import type { Task } from "@/domain/types";
import { cn } from "@/lib/cn";
import { formatDueDate, formatRelativeTime, isOverdue } from "@/lib/dates";
import { setTaskDragData } from "@/lib/task-drag";
import { Input } from "@/components/ui/input";
import { taskCardStyles } from "./task-card.styles";
import type { TaskCardLabels } from "./task-card";

interface OperatorBoardTaskCardProps {
  task: Task;
  locale: string;
  href: string;
  labels: TaskCardLabels & {
    dragHandle: string;
    openTask: string;
    addDueDate: string;
  };
  isDragging?: boolean;
  onDragHandleStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragHandleEnd: () => void;
  onUpdateFields: (
    fields: { title?: string; dueDate?: string | null },
  ) => Promise<void>;
}

function OpenTaskIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M5 5v14h14" />
    </svg>
  );
}

export function OperatorBoardTaskCard({
  task,
  locale,
  href,
  labels,
  isDragging,
  onDragHandleStart,
  onDragHandleEnd,
  onUpdateFields,
}: OperatorBoardTaskCardProps) {
  const overdue = isOverdue(task.dueDate);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [editingDue, setEditingDue] = useState(false);
  const [dueDraft, setDueDraft] = useState(task.dueDate ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitleDraft(task.title);
  }, [task.title]);

  useEffect(() => {
    setDueDraft(task.dueDate ?? "");
  }, [task.dueDate]);

  function handleDragStart(event: DragEvent<HTMLButtonElement>) {
    setTaskDragData(event, task.id);
    onDragHandleStart(event);
  }

  async function saveTitle() {
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      setTitleDraft(task.title);
      setEditingTitle(false);
      return;
    }

    if (trimmed === task.title) {
      setEditingTitle(false);
      return;
    }

    setSaving(true);
    await onUpdateFields({ title: trimmed });
    setSaving(false);
    setEditingTitle(false);
  }

  async function saveDueDate() {
    const nextDue = dueDraft.trim() || null;
    const currentDue = task.dueDate ?? null;
    if (nextDue === currentDue) {
      setEditingDue(false);
      return;
    }

    setSaving(true);
    await onUpdateFields({ dueDate: nextDue });
    setSaving(false);
    setEditingDue(false);
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
        className={taskCardStyles.dragHandle}
        aria-label={labels.dragHandle}
        onDragStart={handleDragStart}
        onDragEnd={onDragHandleEnd}
      >
        ⠿
      </button>

      <div className={taskCardStyles.boardBody}>
        <div className={taskCardStyles.titleRow}>
          {editingTitle ? (
            <Input
              autoFocus
              data-no-drag-scroll
              className={taskCardStyles.inlineInput}
              value={titleDraft}
              disabled={saving}
              onChange={(event) => setTitleDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void saveTitle();
                }
                if (event.key === "Escape") {
                  setTitleDraft(task.title);
                  setEditingTitle(false);
                }
              }}
              onBlur={() => {
                void saveTitle();
              }}
            />
          ) : (
            <button
              type="button"
              data-no-drag-scroll
              className={taskCardStyles.titleButton}
              onClick={() => setEditingTitle(true)}
            >
              {task.title}
            </button>
          )}

          <Link
            href={href}
            data-no-drag-scroll
            className={taskCardStyles.openLink}
            aria-label={labels.openTask}
            title={labels.openTask}
          >
            <OpenTaskIcon />
          </Link>
        </div>

        {task.telegramNotifyFailed && (
          <span
            className={cn(taskCardStyles.notifyDot, "mb-1 inline-block")}
            title="Telegram delivery failed"
          />
        )}

        <div className={taskCardStyles.footer}>
          {editingDue ? (
            <Input
              autoFocus
              type="date"
              data-no-drag-scroll
              className={taskCardStyles.inlineDateInput}
              value={dueDraft}
              disabled={saving}
              onChange={(event) => setDueDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void saveDueDate();
                }
                if (event.key === "Escape") {
                  setDueDraft(task.dueDate ?? "");
                  setEditingDue(false);
                }
              }}
              onBlur={() => {
                void saveDueDate();
              }}
            />
          ) : (
            <button
              type="button"
              data-no-drag-scroll
              className={cn(
                taskCardStyles.dueButton,
                overdue && taskCardStyles.overdue,
              )}
              onClick={() => setEditingDue(true)}
            >
              {task.dueDate
                ? `${labels.dueDate}: ${formatDueDate(task.dueDate, locale)}`
                : labels.addDueDate}
              {overdue && task.dueDate && ` · ${labels.overdue}`}
            </button>
          )}
          <span className={taskCardStyles.meta}>
            {labels.updated} {formatRelativeTime(task.updatedAt, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}
