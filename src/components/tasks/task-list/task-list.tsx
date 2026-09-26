"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ManagedProject, Task, TaskStatus } from "@/domain/types";
import type { TasksScope, TasksView } from "@/lib/tasks-url";
import { taskDetailHref } from "@/lib/tasks-url";
import { formatDueDateNumeric, isOverdue } from "@/lib/dates";
import { nextTaskCategoryId, tagFromOpenProjects } from "@/lib/project";
import { Input, Textarea } from "@/components/ui/input";
import { CheckIcon } from "@/components/ui/icons";
import { popoverStyles } from "@/components/ui/popover";
import { useSync } from "@/components/sync";
import { useDismissable } from "@/hooks/use-dismissable";
import { useFadeOpen } from "@/hooks/use-fade-open";
import { cn } from "@/lib/cn";
import { taskListStyles } from "./task-list.styles";

type CellOption = { value: string; label: string };

const TITLE_MAX = 200;

interface TaskListProps {
  tasks: Task[];
  locale: string;
  scope: TasksScope;
  view: TasksView;
  project?: string | null;
  currentUserId: string;
  canEditAll: boolean;
  openProjects: ManagedProject[];
  assigneeOptions: { id: string; label: string }[];
  labels: {
    title: string;
    assignee: string;
    dueDate: string;
    addDueDate: string;
    statusColumn: string;
    status: Record<TaskStatus, string>;
    project: string;
    category: string;
    projectNone: string;
    categoryNone: string;
  };
}

export function TaskList({
  tasks,
  locale,
  scope,
  view,
  project = null,
  currentUserId,
  canEditAll,
  openProjects,
  assigneeOptions,
  labels,
}: TaskListProps) {
  return (
    <div className={taskListStyles.wrapper}>
      <div className={cn(taskListStyles.cols, taskListStyles.headRow)}>
        <div>{labels.title}</div>
        <div>{labels.project}</div>
        <div>{labels.category}</div>
        <div>{labels.assignee}</div>
        <div>{labels.statusColumn}</div>
        <div>{labels.dueDate}</div>
      </div>
      {tasks.map((task) => (
        <TaskListRow
          key={task.id}
          task={task}
          locale={locale}
          scope={scope}
          view={view}
          project={project}
          canEdit={canEditAll || task.assigneeId === currentUserId}
          canReassign={canEditAll}
          openProjects={openProjects}
          assigneeOptions={assigneeOptions}
          labels={labels}
        />
      ))}
    </div>
  );
}

function TaskListRow({
  task,
  locale,
  scope,
  view,
  project,
  canEdit,
  canReassign,
  openProjects,
  assigneeOptions,
  labels,
}: {
  task: Task;
  locale: string;
  scope: TasksScope;
  view: TasksView;
  project: string | null;
  canEdit: boolean;
  canReassign: boolean;
  openProjects: ManagedProject[];
  assigneeOptions: { id: string; label: string }[];
  labels: TaskListProps["labels"];
}) {
  const { applyTaskUpdate } = useSync();
  const overdue = isOverdue(task.dueDate);
  const categories = useMemo(
    () =>
      openProjects.find((row) => row.id === task.projectId)?.categories ?? [],
    [openProjects, task.projectId],
  );

  const projectOptions = useMemo(() => {
    const options: CellOption[] = [
      { value: "", label: labels.projectNone },
      ...openProjects.map((row) => ({
        value: row.id,
        label: row.acronym,
      })),
    ];
    if (
      task.projectId &&
      !options.some((option) => option.value === task.projectId)
    ) {
      options.push({
        value: task.projectId,
        label: task.projectAcronym ?? task.projectId,
      });
    }
    return options;
  }, [openProjects, labels.projectNone, task.projectId, task.projectAcronym]);

  const categoryOptions = useMemo(() => {
    const options: CellOption[] = [
      { value: "", label: labels.categoryNone },
      ...categories.map((row) => ({ value: row.id, label: row.name })),
    ];
    if (
      task.categoryId &&
      !options.some((option) => option.value === task.categoryId)
    ) {
      options.push({
        value: task.categoryId,
        label: task.categoryName ?? task.categoryId,
      });
    }
    return options;
  }, [categories, labels.categoryNone, task.categoryId, task.categoryName]);

  const assigneeCellOptions = useMemo(() => {
    const options: CellOption[] = assigneeOptions.map((row) => ({
      value: row.id,
      label: row.label,
    }));
    if (
      task.assigneeId &&
      !options.some((option) => option.value === task.assigneeId)
    ) {
      options.push({ value: task.assigneeId, label: task.assigneeName });
    }
    return options;
  }, [assigneeOptions, task.assigneeId, task.assigneeName]);

  const statusOptions: CellOption[] = [
    { value: "todo", label: labels.status.todo },
    { value: "doing", label: labels.status.doing },
    { value: "done", label: labels.status.done },
  ];

  async function saveFields(
    fields: {
      title?: string;
      dueDate?: string | null;
      projectId?: string | null;
      categoryId?: string | null;
    },
    patch: Partial<Task>,
  ) {
    if (Object.keys(patch).length === 0) return;
    await applyTaskUpdate(task.id, patch, [
      { type: "update_fields", taskId: task.id, payload: fields },
    ]);
  }

  async function saveTitle(title: string) {
    const trimmed = title.replace(/\s+/g, " ").trim().slice(0, TITLE_MAX);
    if (!trimmed || trimmed === task.title) return;
    await saveFields({ title: trimmed }, { title: trimmed });
  }

  async function saveProject(projectId: string | null) {
    if (projectId === (task.projectId ?? null)) return;
    const tag = tagFromOpenProjects(projectId, openProjects, {
      id: task.projectId,
      acronym: task.projectAcronym,
    });
    const categoryId = nextTaskCategoryId({
      projectId: tag.projectId,
      projectChanged: true,
      currentId: task.categoryId,
      openIds:
        openProjects
          .find((row) => row.id === tag.projectId)
          ?.categories.map((row) => row.id) ?? [],
    });
    const categoryName =
      openProjects
        .flatMap((row) => row.categories)
        .find((row) => row.id === categoryId)?.name ?? null;
    await saveFields(
      { projectId: tag.projectId, categoryId },
      { ...tag, categoryId, categoryName },
    );
  }

  async function saveCategory(categoryId: string | null) {
    if (categoryId === (task.categoryId ?? null)) return;
    const name =
      categories.find((row) => row.id === categoryId)?.name ??
      (categoryId === task.categoryId ? task.categoryName : null);
    await saveFields({ categoryId }, { categoryId, categoryName: name });
  }

  async function saveAssignee(assigneeId: string) {
    if (!assigneeId || assigneeId === task.assigneeId) return;
    const assigneeName =
      assigneeOptions.find((row) => row.id === assigneeId)?.label ??
      task.assigneeName;
    await applyTaskUpdate(
      task.id,
      { assigneeId, assigneeName },
      [
        {
          type: "reassign",
          taskId: task.id,
          payload: { assigneeId, assigneeName },
        },
      ],
    );
  }

  async function saveStatus(status: TaskStatus) {
    if (status === task.status) return;
    await applyTaskUpdate(
      task.id,
      { status },
      [{ type: "update_status", taskId: task.id, payload: { status } }],
    );
  }

  async function saveDue(dueDate: string | null) {
    if (dueDate === (task.dueDate ?? null)) return;
    await saveFields({ dueDate }, { dueDate });
  }

  return (
    <div className={cn(taskListStyles.cols, taskListStyles.row)}>
      <div className={taskListStyles.cell}>
        {canEdit ? (
          <TitleCell title={task.title} label={labels.title} onSave={saveTitle} />
        ) : (
          <Link
            href={taskDetailHref(locale, task.id, { scope, view, project })}
            className={taskListStyles.link}
          >
            {task.title}
          </Link>
        )}
      </div>
      <div className={taskListStyles.meta}>
        <div className={taskListStyles.cell}>
          <CellPicker
            value={task.projectId ?? ""}
            options={projectOptions}
            label={labels.project}
            disabled={!canEdit}
            onChange={(next) => void saveProject(next || null)}
          />
        </div>
        <div className={taskListStyles.cell}>
          <CellPicker
            value={task.categoryId ?? ""}
            options={categoryOptions}
            label={labels.category}
            disabled={!canEdit || !task.projectId}
            onChange={(next) => void saveCategory(next || null)}
          />
        </div>
        <div className={taskListStyles.cell}>
          <CellPicker
            value={task.assigneeId}
            options={assigneeCellOptions}
            label={labels.assignee}
            disabled={!canReassign}
            onChange={(next) => void saveAssignee(next)}
          />
        </div>
        <div className={taskListStyles.cell}>
          <CellPicker
            value={task.status}
            options={statusOptions}
            label={labels.statusColumn}
            disabled={!canEdit}
            onChange={(next) => void saveStatus(next as TaskStatus)}
          />
        </div>
        <div className={taskListStyles.cellDue}>
          {canEdit ? (
            <DueCell
              dueDate={task.dueDate}
              locale={locale}
              overdue={overdue}
              dueLabel={labels.dueDate}
              emptyLabel={labels.addDueDate}
              onSave={saveDue}
            />
          ) : (
            <span className={cn(overdue && taskListStyles.dueOverdue)}>
              {formatDueDateNumeric(task.dueDate, locale)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TitleCell({
  title,
  label,
  onSave,
}: {
  title: string;
  label: string;
  onSave: (title: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  useEffect(() => {
    setDraft(title);
  }, [title]);

  if (!editing) {
    return (
      <button
        type="button"
        className={cn(
          taskListStyles.cellTrigger,
          taskListStyles.cellValue,
          taskListStyles.titleTrigger,
        )}
        aria-label={label}
        onClick={() => setEditing(true)}
      >
        {title}
      </button>
    );
  }

  return (
    <Textarea
      autoFocus
      rows={2}
      maxLength={TITLE_MAX}
      value={draft}
      aria-label={label}
      onChange={(event) => setDraft(event.target.value.slice(0, TITLE_MAX))}
      onBlur={() => {
        void onSave(draft).finally(() => setEditing(false));
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setDraft(title);
          setEditing(false);
        }
      }}
      className={taskListStyles.inlineInput}
    />
  );
}

function DueCell({
  dueDate,
  locale,
  overdue,
  dueLabel,
  emptyLabel,
  onSave,
}: {
  dueDate: string | null;
  locale: string;
  overdue: boolean;
  dueLabel: string;
  emptyLabel: string;
  onSave: (dueDate: string | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(dueDate ?? "");
  useEffect(() => {
    setDraft(dueDate ?? "");
  }, [dueDate]);

  if (editing) {
    return (
      <Input
        autoFocus
        type="date"
        value={draft}
        aria-label={dueLabel}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          void onSave(draft.trim() || null).finally(() => setEditing(false));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            setDraft(dueDate ?? "");
            setEditing(false);
          }
        }}
        className={taskListStyles.inlineDate}
      />
    );
  }

  const empty = !dueDate;
  return (
    <button
      type="button"
      className={cn(
        taskListStyles.cellTrigger,
        empty ? taskListStyles.cellEmpty : taskListStyles.cellValue,
        overdue && taskListStyles.dueOverdue,
      )}
      aria-label={dueLabel}
      onClick={() => setEditing(true)}
    >
      {empty ? emptyLabel : formatDueDateNumeric(dueDate, locale)}
    </button>
  );
}

function CellPicker({
  value,
  options,
  label,
  disabled,
  onChange,
}: {
  value: string;
  options: CellOption[];
  label: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { rendered, visible, onTransitionEnd } = useFadeOpen(open);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? value;

  useDismissable(open, () => setOpen(false), rootRef);

  if (disabled) {
    return (
      <span
        className={cn(
          "truncate",
          value ? taskListStyles.cellValue : taskListStyles.cellEmpty,
        )}
      >
        {selectedLabel}
      </span>
    );
  }

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={taskListStyles.picker}>
      <button
        type="button"
        className={cn(
          taskListStyles.cellTrigger,
          "truncate",
          value ? taskListStyles.cellValue : taskListStyles.cellEmpty,
          open && taskListStyles.cellTriggerOpen,
        )}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={rendered ? listId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {selectedLabel}
      </button>
      {rendered ? (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            popoverStyles.panel,
            popoverStyles.panelDropdownLeft,
            taskListStyles.pickerPanel,
            visible
              ? popoverStyles.panelMotionOpen
              : popoverStyles.panelMotionClose,
            visible ? popoverStyles.panelOpen : popoverStyles.panelClosed,
          )}
          onTransitionEnd={onTransitionEnd}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  tabIndex={visible ? 0 : -1}
                  className={cn(
                    popoverStyles.item,
                    "justify-between gap-2",
                    active && popoverStyles.itemActive,
                  )}
                  onClick={() => pick(option.value)}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {active ? <CheckIcon /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
