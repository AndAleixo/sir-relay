"use client";

import { useEffect, useState, type DragEvent } from "react";
import type { Task } from "@/domain/types";
import { cn } from "@/lib/cn";
import { formatDueDate, isOverdue } from "@/lib/dates";
import { setTaskDragData } from "@/lib/task-drag";
import { Input } from "@/components/ui/input";
import { taskCardStyles } from "./task-card.styles";
import type { TaskCardLabels } from "./task-card-labels";
import { StartDoingIcon } from "./start-doing-icon";
import { MarkDoneIcon } from "./mark-done-icon";
import { TaskCardMenu } from "./task-card-menu";

interface BoardTaskCardProps {
  task: Task;
  locale: string;
  href: string;
  labels: TaskCardLabels & {
    dragHandle: string;
    addDueDate: string;
    startDoing?: string;
    markDone?: string;
    completedMark?: string;
    taskMenu: string;
    menuOpen: string;
    menuClone: string;
    menuDelete: string;
    deleteConfirm: string;
  };
  /** View-only: no drag, inline edit, or status controls. Menu: Open only. */
  readOnly?: boolean;
  isDragging?: boolean;
  isQueueHead?: boolean;
  showCompletedMark?: boolean;
  onDragHandleStart?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragHandleEnd?: () => void;
  onUpdateFields?: (
    fields: { title?: string; dueDate?: string | null },
  ) => Promise<void>;
  onStartDoing?: () => void;
  onMarkDone?: () => void;
  onClone?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}

export function BoardTaskCard({
  task,
  locale,
  href,
  labels,
  readOnly = false,
  isDragging,
  isQueueHead,
  showCompletedMark,
  onDragHandleStart,
  onDragHandleEnd,
  onUpdateFields,
  onStartDoing,
  onMarkDone,
  onClone,
  onDelete,
}: BoardTaskCardProps) {
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
    if (readOnly || !onDragHandleStart) return;
    setTaskDragData(event, task.id);
    onDragHandleStart(event);
  }

  async function saveTitle() {
    if (!onUpdateFields) return;
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
    if (!onUpdateFields) return;
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

  const dueLabel = task.dueDate
    ? `${labels.dueDate}: ${formatDueDate(task.dueDate, locale)}`
    : labels.addDueDate;
  const dueWithOverdue =
    overdue && task.dueDate ? `${dueLabel} · ${labels.overdue}` : dueLabel;

  const statusControl =
    !readOnly && isQueueHead && onStartDoing && labels.startDoing ? (
      <button
        type="button"
        className={taskCardStyles.startDoing}
        aria-label={labels.startDoing}
        title={labels.startDoing}
        disabled={saving}
        onClick={() => onStartDoing()}
      >
        <StartDoingIcon />
      </button>
    ) : !readOnly && onMarkDone && labels.markDone ? (
      <button
        type="button"
        className={taskCardStyles.markDone}
        aria-label={labels.markDone}
        title={labels.markDone}
        disabled={saving}
        onClick={() => onMarkDone()}
      >
        <MarkDoneIcon />
      </button>
    ) : showCompletedMark ? (
      <span
        className={taskCardStyles.completedMark}
        title={labels.completedMark}
        aria-label={labels.completedMark}
      >
        <MarkDoneIcon />
      </span>
    ) : null;

  return (
    <div
      data-no-drag-scroll
      className={cn(
        taskCardStyles.root,
        taskCardStyles.layout,
        isDragging && taskCardStyles.dragging,
        readOnly && taskCardStyles.readOnly,
      )}
    >
      {readOnly ? (
        <span className={taskCardStyles.dragHandleSpacer} aria-hidden />
      ) : (
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
      )}

      <div className={taskCardStyles.boardBody}>
        <div className={taskCardStyles.titleRow}>
          {readOnly ? (
            <p className={taskCardStyles.titleReadonly}>{task.title}</p>
          ) : editingTitle ? (
            <Input
              autoFocus
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
              className={taskCardStyles.titleButton}
              onClick={() => setEditingTitle(true)}
            >
              {task.title}
            </button>
          )}
          {statusControl}
        </div>

        <div
          className={cn(
            taskCardStyles.footer,
            task.telegramNotifyFailed && "pr-3",
          )}
        >
          {readOnly ? (
            <p
              className={cn(
                taskCardStyles.dueReadonly,
                "min-w-0 flex-1",
                overdue && taskCardStyles.overdue,
              )}
            >
              {task.dueDate ? dueWithOverdue : null}
            </p>
          ) : editingDue ? (
            <Input
              autoFocus
              type="date"
              className={cn(taskCardStyles.inlineDateInput, "flex-1")}
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
              className={cn(
                taskCardStyles.dueButton,
                "min-w-0 flex-1",
                overdue && taskCardStyles.overdue,
              )}
              onClick={() => setEditingDue(true)}
            >
              {dueWithOverdue}
            </button>
          )}
          <TaskCardMenu
            href={href}
            menuLabel={labels.taskMenu}
            openLabel={labels.menuOpen}
            cloneLabel={labels.menuClone}
            deleteLabel={labels.menuDelete}
            deleteConfirm={labels.deleteConfirm}
            canMutate={!readOnly && Boolean(onClone && onDelete)}
            disabled={saving}
            onClone={() => onClone?.()}
            onDelete={() => onDelete?.()}
          />
        </div>
      </div>

      {task.telegramNotifyFailed && (
        <span
          className={taskCardStyles.notifyDotCorner}
          title="Telegram delivery failed"
        />
      )}
    </div>
  );
}
