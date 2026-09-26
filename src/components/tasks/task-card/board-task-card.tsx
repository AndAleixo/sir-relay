"use client";

import { useEffect, useState, type DragEvent } from "react";
import type { Task } from "@/domain/types";
import { cn } from "@/lib/cn";
import { formatDueDate, isOverdue } from "@/lib/dates";
import { formatTaskHeading } from "@/lib/project";
import { setTaskDragData } from "@/lib/task-drag";
import { Input } from "@/components/ui/input";
import { taskCardStyles } from "./task-card.styles";
import type { TaskCardLabels } from "./task-card-labels";
import { StartDoingIcon } from "./start-doing-icon";
import { MarkDoneIcon } from "./mark-done-icon";
import { TaskCardMenu } from "./task-card-menu";
import {
  TaskProjectPicker,
  type TaskOpenProject,
} from "./task-project-picker";

export type TaskCardFieldPatch = {
  title?: string;
  dueDate?: string | null;
  projectId?: string | null;
  categoryId?: string | null;
};

interface BoardTaskCardProps {
  task: Task;
  locale: string;
  href: string;
  labels: TaskCardLabels;
  openProjects?: readonly TaskOpenProject[];
  /** View-only: no drag, inline edit, or status controls. Menu: Open only. */
  readOnly?: boolean;
  isDragging?: boolean;
  isQueueHead?: boolean;
  showCompletedMark?: boolean;
  onDragHandleStart?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragHandleEnd?: () => void;
  onUpdateFields?: (fields: TaskCardFieldPatch) => Promise<void>;
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
  openProjects = [],
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
  const [menuOpen, setMenuOpen] = useState(false);

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

  async function saveProject(projectId: string | null) {
    if (!onUpdateFields) return;
    if (projectId === (task.projectId ?? null)) return;
    setSaving(true);
    await onUpdateFields({ projectId });
    setSaving(false);
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
  const descriptionPreview = task.description.replace(/\s+/g, " ").trim();
  const hasDue = Boolean(task.dueDate);
  const descriptionUnderTitle = Boolean(descriptionPreview && hasDue);
  const descriptionInFooter = Boolean(descriptionPreview && !hasDue);

  const dragDifficultyClass =
    task.difficulty === "easy"
      ? taskCardStyles.dragHandleEasy
      : task.difficulty === "medium"
        ? taskCardStyles.dragHandleMedium
        : task.difficulty === "hard"
          ? taskCardStyles.dragHandleHard
          : undefined;
  const spacerDifficultyClass =
    task.difficulty === "easy"
      ? taskCardStyles.dragHandleSpacerEasy
      : task.difficulty === "medium"
        ? taskCardStyles.dragHandleSpacerMedium
        : task.difficulty === "hard"
          ? taskCardStyles.dragHandleSpacerHard
          : undefined;

  const statusControl =
    !readOnly && isQueueHead && onStartDoing ? (
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
    ) : !readOnly && onMarkDone ? (
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

  const pickerProps = {
    currentId: task.projectId,
    currentAcronym: task.projectAcronym ?? "",
    projects: openProjects,
    noneLabel: labels.projectNone,
    ariaLabel: labels.project,
    scrollLeftLabel: labels.projectScrollLeft,
    scrollRightLabel: labels.projectScrollRight,
    disabled: saving,
    onPick: (projectId: string | null) => void saveProject(projectId),
  };

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
        <span
          className={cn(
            taskCardStyles.dragHandleSpacer,
            spacerDifficultyClass,
          )}
          aria-hidden
        />
      ) : (
        <button
          type="button"
          draggable
          className={cn(taskCardStyles.dragHandle, dragDifficultyClass)}
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
            <p className={taskCardStyles.titleReadonly}>
              {formatTaskHeading(task.title, task.projectAcronym)}
            </p>
          ) : editingTitle ? (
            <>
              {task.projectAcronym ? <TaskProjectPicker {...pickerProps} /> : null}
              <Input
                autoFocus
                className={cn(taskCardStyles.inlineInput, "min-w-0 flex-1")}
                value={titleDraft}
                maxLength={200}
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
            </>
          ) : task.projectAcronym ? (
            <TaskProjectPicker {...pickerProps}>
              <span
                role="button"
                tabIndex={0}
                className={taskCardStyles.titleTextButton}
                onClick={() => setEditingTitle(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setEditingTitle(true);
                  }
                }}
              >
                {task.title}
              </span>
            </TaskProjectPicker>
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

        {descriptionUnderTitle ? (
          <p className={taskCardStyles.descriptionPreview}>{descriptionPreview}</p>
        ) : null}

        <div
          className={cn(
            taskCardStyles.footer,
            task.telegramNotifyFailed && "pr-3",
          )}
        >
          <div
            className={cn(
              taskCardStyles.footerSlot,
              taskCardStyles.overlayFade,
              menuOpen && taskCardStyles.overlayFaded,
            )}
          >
            {editingDue && !readOnly ? (
              <Input
                autoFocus
                type="date"
                className={cn(taskCardStyles.inlineDateInput, "w-full")}
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
            ) : hasDue ? (
              readOnly ? (
                <p
                  className={cn(
                    taskCardStyles.dueReadonly,
                    overdue && taskCardStyles.overdue,
                  )}
                >
                  {dueWithOverdue}
                </p>
              ) : (
                <button
                  type="button"
                  className={cn(
                    taskCardStyles.dueButton,
                    "w-full",
                    overdue && taskCardStyles.overdue,
                  )}
                  onClick={() => setEditingDue(true)}
                >
                  {dueWithOverdue}
                </button>
              )
            ) : descriptionInFooter ? (
              <p className={taskCardStyles.descriptionInFooter}>
                {descriptionPreview}
              </p>
            ) : readOnly ? null : (
              <button
                type="button"
                className={cn(taskCardStyles.dueButton, "w-full")}
                onClick={() => setEditingDue(true)}
              >
                {labels.addDueDate}
              </button>
            )}
          </div>
          <TaskCardMenu
            href={href}
            taskMenu={labels.taskMenu}
            menuOpen={labels.menuOpen}
            menuClone={labels.menuClone}
            menuDelete={labels.menuDelete}
            deleteConfirm={labels.deleteConfirm}
            canMutate={!readOnly && Boolean(onClone && onDelete)}
            disabled={saving}
            onOpenChange={setMenuOpen}
            onClone={() => onClone?.()}
            onDelete={() => onDelete?.()}
          />
        </div>
      </div>

      {task.telegramNotifyFailed && (
        <span
          className={taskCardStyles.notifyDotCorner}
          title={labels.telegramFailed}
        />
      )}
    </div>
  );
}
