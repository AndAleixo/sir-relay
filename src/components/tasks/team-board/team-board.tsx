"use client";

import { useState } from "react";
import Link from "next/link";
import type { DragEvent } from "react";
import type { Task, TaskStatus } from "@/domain/types";
import type { OrganizationUser } from "@/services/contracts";
import { cn } from "@/lib/cn";
import { groupMemberLabel } from "@/lib/group-member-label";
import {
  buildTodoQueueOrder,
  groupTasksByStatusOrdered,
  TODO_QUEUE_APPEND,
} from "@/lib/task-queue";
import {
  clearTaskDragData,
  dropTargetKey,
  getTaskIdFromDragEvent,
} from "@/lib/task-drag";
import type { MutationInput } from "@/domain/sync";
import { useSync } from "@/components/sync";
import { useHorizontalDragScroll } from "@/hooks/use-horizontal-drag-scroll";
import {
  MemberNameRow,
  memberInactiveLabel,
} from "@/components/ui/member-status-icons";
import {
  BoardTaskCard,
  type TaskCardLabels,
} from "@/components/tasks/task-card";
import { TodoReorderList, resolveTodoDropIndex } from "@/components/tasks/todo-reorder-list";
import { BoardQuickAddTask } from "@/components/tasks/board-quick-add-task";
import type { TasksScope, TasksView } from "@/lib/tasks-url";
import { taskDetailHref } from "@/lib/tasks-url";
import {
  sectionListNeedsScroll,
} from "@/components/tasks/board-section-scroll";
import {
  DONE_PREVIEW_INITIAL,
  DONE_PREVIEW_STEP,
} from "@/components/tasks/done-preview";
import { teamBoardStyles } from "./team-board.styles";

interface BoardSelfMember {
  id: string;
  name: string;
  email?: string;
  displayName?: string | null;
  telegramStatus?: "linked" | "pending";
}

interface TeamBoardProps {
  /** Signed-in member’s column (first). */
  self: BoardSelfMember;
  /** Other group members (page-load order: To do count desc). Excludes signed-in user. */
  members: OrganizationUser[];
  tasks: Task[];
  locale: string;
  scope: TasksScope;
  view: TasksView;
  project?: string | null;
  /** `all` = edit every column; `self-only` = edit own column, view others. */
  editMode?: "all" | "self-only";
  /** Operator-only: name links to /teammates/[id]. */
  linkMemberProfiles?: boolean;
  labels: TaskCardLabels & {
    todo: string;
    doing: string;
    done: string;
    linked: string;
    pending: string;
    invited: string;
    inactive: string;
    showMore: string;
    emptyBoard: string;
    addTask: string;
    titlePlaceholder: string;
  };
}

function SectionCardList({
  itemCount,
  todoScroll,
  children,
}: {
  itemCount: number;
  /** Edge auto-scroll target for TodoReorderList only. */
  todoScroll?: boolean;
  children: React.ReactNode;
}) {
  const scrollable = sectionListNeedsScroll(itemCount);

  return (
    <div
      data-no-drag-scroll
      data-todo-scroll={todoScroll ? "" : undefined}
      className={cn(
        teamBoardStyles.cardList,
        scrollable && teamBoardStyles.cardListScrollable,
      )}
    >
      {children}
    </div>
  );
}

function BoardTaskItem({
  task,
  locale,
  scope,
  view,
  project = null,
  labels,
  readOnly,
  draggingTaskId,
  isQueueHead,
  showCompletedMark,
  onDragStart,
  onDragEnd,
  onUpdateFields,
  onStartDoing,
  onMarkDone,
  onClone,
  onDelete,
}: {
  task: Task;
  locale: string;
  scope: TasksScope;
  view: TasksView;
  project?: string | null;
  labels: TeamBoardProps["labels"];
  readOnly?: boolean;
  draggingTaskId: string | null;
  isQueueHead?: boolean;
  showCompletedMark?: boolean;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onUpdateFields: (
    taskId: string,
    fields: { title?: string; dueDate?: string | null },
  ) => Promise<void>;
  onStartDoing?: () => void;
  onMarkDone?: () => void;
  onClone: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}) {
  return (
    <BoardTaskCard
      task={task}
      locale={locale}
      href={taskDetailHref(locale, task.id, { scope, view, project })}
      labels={labels}
      readOnly={readOnly}
      isDragging={!readOnly && draggingTaskId === task.id}
      isQueueHead={isQueueHead}
      showCompletedMark={showCompletedMark}
      onDragHandleStart={readOnly ? undefined : () => onDragStart(task.id)}
      onDragHandleEnd={readOnly ? undefined : onDragEnd}
      onUpdateFields={
        readOnly ? undefined : (fields) => onUpdateFields(task.id, fields)
      }
      onStartDoing={readOnly ? undefined : onStartDoing}
      onMarkDone={readOnly ? undefined : onMarkDone}
      onClone={readOnly ? undefined : () => onClone(task.id)}
      onDelete={readOnly ? undefined : () => onDelete(task.id)}
    />
  );
}

function DroppableSection({
  title,
  assigneeId,
  status,
  editable,
  activeDropTarget,
  onSectionDragOver,
  onDrop,
  footer,
  itemCount,
  children,
}: {
  title: string;
  assigneeId: string;
  status: TaskStatus;
  editable: boolean;
  activeDropTarget: string | null;
  onSectionDragOver: (key: string) => void;
  onDrop: (
    assigneeId: string,
    status: TaskStatus,
    event: DragEvent<HTMLElement>,
  ) => void;
  footer?: React.ReactNode;
  itemCount: number;
  children: React.ReactNode;
}) {
  const key = dropTargetKey(assigneeId, status);

  return (
    <section
      className={cn(
        teamBoardStyles.section,
        editable && activeDropTarget === key && teamBoardStyles.sectionDropTarget,
      )}
      onDragOver={
        editable
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              event.dataTransfer.dropEffect = "move";
              onSectionDragOver(key);
            }
          : undefined
      }
      onDrop={
        editable
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              onDrop(assigneeId, status, event);
            }
          : undefined
      }
    >
      <h3 className={teamBoardStyles.sectionTitle}>{title}</h3>
      <SectionCardList
        itemCount={itemCount}
        todoScroll={editable && status === "todo"}
      >
        {children}
      </SectionCardList>
      {footer}
    </section>
  );
}

function TaskColumn({
  assigneeId,
  assigneeName,
  header,
  tasks,
  locale,
  scope,
  view,
  project = null,
  labels,
  editable,
  draggingTaskId,
  activeDropTarget,
  onDragStart,
  onDragEnd,
  onSectionDragOver,
  onDrop,
  onPlaceInTodo,
  onAssignToColumn,
  onUpdateFields,
  onQuickCreate,
  onClone,
  onDelete,
}: {
  assigneeId: string;
  assigneeName: string;
  header: React.ReactNode;
  tasks: Task[];
  locale: string;
  scope: TasksScope;
  view: TasksView;
  project?: string | null;
  labels: TeamBoardProps["labels"];
  editable: boolean;
  draggingTaskId: string | null;
  activeDropTarget: string | null;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onSectionDragOver: (key: string) => void;
  onDrop: (
    assigneeId: string,
    status: TaskStatus,
    event: DragEvent<HTMLElement>,
  ) => void;
  onPlaceInTodo: (assigneeId: string, taskId: string, toIndex: number) => void;
  onAssignToColumn: (
    assigneeId: string,
    status: TaskStatus,
    taskId: string,
  ) => void;
  onUpdateFields: (
    taskId: string,
    fields: { title?: string; dueDate?: string | null },
  ) => Promise<void>;
  onQuickCreate: (input: {
    title: string;
    assigneeId: string;
    assigneeName: string;
  }) => Promise<boolean>;
  onClone: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}) {
  const [doneOpen, setDoneOpen] = useState(false);
  const [doneLimit, setDoneLimit] = useState(DONE_PREVIEW_INITIAL);
  const grouped = groupTasksByStatusOrdered(tasks);
  const doneVisible = grouped.done.slice(-doneLimit);
  const hasMoreDone = grouped.done.length > doneLimit;
  const doneKey = dropTargetKey(assigneeId, "done");

  return (
    <article className={teamBoardStyles.column}>
      <header className={teamBoardStyles.columnHeader}>{header}</header>

      <DroppableSection
        title={`${labels.todo} (${grouped.todo.length})`}
        assigneeId={assigneeId}
        status="todo"
        editable={editable}
        activeDropTarget={activeDropTarget}
        onSectionDragOver={onSectionDragOver}
        onDrop={onDrop}
        itemCount={grouped.todo.length}
        footer={
          editable ? (
            <BoardQuickAddTask
              assigneeId={assigneeId}
              assigneeName={assigneeName}
              addLabel={labels.addTask}
              titlePlaceholder={labels.titlePlaceholder}
              onCreate={onQuickCreate}
            />
          ) : null
        }
      >
        {editable ? (
          <TodoReorderList
            draggingTaskId={draggingTaskId}
            onPlace={(taskId, toIndex) =>
              onPlaceInTodo(assigneeId, taskId, toIndex)
            }
            items={grouped.todo.map((task, index) => ({
              id: task.id,
              node: (
                <BoardTaskItem
                  task={task}
                  locale={locale}
                  scope={scope}
                  view={view} project={project}
                  labels={labels}
                  draggingTaskId={draggingTaskId}
                  isQueueHead={index === 0}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onUpdateFields={onUpdateFields}
                  onStartDoing={
                    index === 0
                      ? () => onAssignToColumn(assigneeId, "doing", task.id)
                      : undefined
                  }
                  onClone={onClone}
                  onDelete={onDelete}
                />
              ),
            }))}
          />
        ) : (
          grouped.todo.map((task) => (
            <BoardTaskItem
              key={task.id}
              task={task}
              locale={locale}
              scope={scope}
              view={view} project={project}
              labels={labels}
              readOnly
              draggingTaskId={null}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onUpdateFields={onUpdateFields}
              onClone={onClone}
              onDelete={onDelete}
            />
          ))
        )}
      </DroppableSection>

      <DroppableSection
        title={`${labels.doing} (${grouped.doing.length})`}
        assigneeId={assigneeId}
        status="doing"
        editable={editable}
        activeDropTarget={activeDropTarget}
        onSectionDragOver={onSectionDragOver}
        onDrop={onDrop}
        itemCount={grouped.doing.length}
      >
        {grouped.doing.map((task) => (
          <BoardTaskItem
            key={task.id}
            task={task}
            locale={locale}
            scope={scope}
            view={view} project={project}
            labels={labels}
            readOnly={!editable}
            draggingTaskId={draggingTaskId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onUpdateFields={onUpdateFields}
            onMarkDone={
              editable
                ? () => onAssignToColumn(assigneeId, "done", task.id)
                : undefined
            }
            onClone={onClone}
            onDelete={onDelete}
          />
        ))}
      </DroppableSection>

      <div
        className={cn(
          teamBoardStyles.doneSection,
          editable &&
            activeDropTarget === doneKey &&
            teamBoardStyles.sectionDropTarget,
        )}
        onDragOver={
          editable
            ? (event) => {
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "move";
                onSectionDragOver(doneKey);
              }
            : undefined
        }
        onDrop={
          editable
            ? (event) => {
                event.preventDefault();
                event.stopPropagation();
                const taskId = getTaskIdFromDragEvent(event);
                onDragEnd();
                if (taskId) void onAssignToColumn(assigneeId, "done", taskId);
              }
            : undefined
        }
      >
        <button
          type="button"
          className={teamBoardStyles.doneToggle}
          onClick={() => {
            if (doneOpen) setDoneLimit(DONE_PREVIEW_INITIAL);
            setDoneOpen(!doneOpen);
          }}
        >
          <span>{doneOpen ? "▾" : "▸"}</span>
          {labels.done} ({grouped.done.length})
        </button>
        {doneOpen && (
          <div className={teamBoardStyles.cardList}>
            {doneVisible.map((task) => (
              <BoardTaskItem
                key={task.id}
                task={task}
                locale={locale}
                scope={scope}
                view={view} project={project}
                labels={labels}
                readOnly={!editable}
                draggingTaskId={draggingTaskId}
                showCompletedMark
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onUpdateFields={onUpdateFields}
                onClone={onClone}
                onDelete={onDelete}
              />
            ))}
            {hasMoreDone && (
              <button
                type="button"
                className={teamBoardStyles.showMore}
                onClick={() =>
                  setDoneLimit((n) => n + DONE_PREVIEW_STEP)
                }
              >
                {labels.showMore}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function MemberColumnHeader({
  member,
  locale,
  labels,
  linkToProfile,
}: {
  member: {
    id: string;
    name: string;
    email: string;
    displayName?: string | null;
    active?: boolean;
    telegramStatus?: "linked" | "pending";
    accountStatus?: "active" | "invited" | null;
  };
  locale: string;
  labels: TeamBoardProps["labels"];
  linkToProfile: boolean;
}) {
  const inactiveLabel = memberInactiveLabel(member, {
    invited: labels.invited,
    inactive: labels.inactive,
  });
  const name = groupMemberLabel(member);

  return (
    <MemberNameRow
      nameNode={
        linkToProfile ? (
          <Link
            href={`/${locale}/teammates/${member.id}`}
            className={teamBoardStyles.memberName}
          >
            {name}
          </Link>
        ) : (
          <span className={teamBoardStyles.memberNamePlain}>{name}</span>
        )
      }
      telegramStatus={member.telegramStatus}
      inactiveLabel={inactiveLabel}
      labels={{ linked: labels.linked, pending: labels.pending }}
    />
  );
}

export function TeamBoard({
  self,
  members,
  tasks,
  locale,
  scope,
  view,
  project = null,
  editMode = "all",
  linkMemberProfiles = true,
  labels,
}: TeamBoardProps) {
  const { applyTaskUpdate, createTaskQuick, placeInTodoQueue, cloneTask, deleteTask } =
    useSync();
  const { scrollRef, scrollHandlers } = useHorizontalDragScroll();
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);

  function columnEditable(assigneeId: string) {
    return editMode === "all" || assigneeId === self.id;
  }

  const assigneeById: Record<string, { id: string; name: string }> = {
    [self.id]: {
      id: self.id,
      name: groupMemberLabel({
        name: self.name,
        email: self.email ?? "",
        displayName: self.displayName,
      }),
    },
    ...Object.fromEntries(
      members.map((member) => [
        member.id,
        { id: member.id, name: groupMemberLabel(member) },
      ]),
    ),
  };

  function handleDragStart(taskId: string) {
    setDraggingTaskId(taskId);
  }

  function handleDragEnd() {
    setDraggingTaskId(null);
    setActiveDropTarget(null);
    clearTaskDragData();
  }

  async function placeInTodo(
    assigneeId: string,
    taskId: string,
    toIndex: number,
  ) {
    handleDragEnd();
    if (!columnEditable(assigneeId)) return;
    await placeInTodoQueue(
      taskId,
      assigneeId,
      buildTodoQueueOrder(tasks, assigneeId, taskId, toIndex),
    );
  }

  async function assignToColumn(
    targetAssigneeId: string,
    targetStatus: TaskStatus,
    taskId: string,
  ) {
    if (!columnEditable(targetAssigneeId)) return;
    const task = tasks.find((t) => t.id === taskId);
    const target = assigneeById[targetAssigneeId];
    if (!task || !target) return;

    const needsReassign = task.assigneeId !== targetAssigneeId;
    const needsStatus = task.status !== targetStatus;
    if (!needsReassign && !needsStatus) return;

    const mutations: MutationInput[] = [];
    if (needsStatus) {
      mutations.push({
        type: "update_status",
        taskId,
        payload: { status: targetStatus },
      });
    }
    if (needsReassign) {
      mutations.push({
        type: "reassign",
        taskId,
        payload: { assigneeId: target.id, assigneeName: target.name },
      });
    }

    await applyTaskUpdate(
      taskId,
      {
        ...(needsReassign
          ? { assigneeId: target.id, assigneeName: target.name }
          : {}),
        ...(needsStatus ? { status: targetStatus } : {}),
      },
      mutations,
    );
  }

  async function handleSectionDrop(
    targetAssigneeId: string,
    targetStatus: TaskStatus,
    event: DragEvent<HTMLElement>,
  ) {
    const taskId = getTaskIdFromDragEvent(event);
    handleDragEnd();
    if (!taskId) return;

    if (targetStatus === "todo") {
      await placeInTodo(
        targetAssigneeId,
        taskId,
        resolveTodoDropIndex(event, taskId, TODO_QUEUE_APPEND),
      );
      return;
    }

    await assignToColumn(targetAssigneeId, targetStatus, taskId);
  }

  async function handleUpdateFields(
    taskId: string,
    fields: { title?: string; dueDate?: string | null },
  ) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !columnEditable(task.assigneeId)) return;

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

  function handleQuickCreate(input: {
    title: string;
    assigneeId: string;
    assigneeName: string;
  }) {
    if (!columnEditable(input.assigneeId)) return Promise.resolve(false);
    return createTaskQuick(locale, input);
  }

  const selfTasks = tasks.filter((t) => t.assigneeId === self.id);

  if (members.length === 0 && selfTasks.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-[var(--border)] bg-surface-card p-8 text-center text-sm text-[var(--text-muted)]">
        {labels.emptyBoard}
      </p>
    );
  }

  return (
    <>
      <div
        ref={scrollRef}
        className={teamBoardStyles.scroll}
        {...scrollHandlers}
      >
        <TaskColumn
          assigneeId={self.id}
          assigneeName={groupMemberLabel({
            name: self.name,
            email: self.email ?? "",
            displayName: self.displayName,
          })}
          header={
            <MemberColumnHeader
              member={{
                id: self.id,
                name: self.name,
                email: self.email ?? "",
                displayName: self.displayName,
                telegramStatus: self.telegramStatus,
              }}
              locale={locale}
              labels={labels}
              linkToProfile={linkMemberProfiles}
            />
          }
          tasks={selfTasks}
          locale={locale}
          scope={scope}
          view={view} project={project}
          labels={labels}
          editable={columnEditable(self.id)}
          draggingTaskId={draggingTaskId}
          activeDropTarget={activeDropTarget}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onSectionDragOver={setActiveDropTarget}
          onDrop={handleSectionDrop}
          onPlaceInTodo={placeInTodo}
          onAssignToColumn={assignToColumn}
          onUpdateFields={handleUpdateFields}
          onQuickCreate={handleQuickCreate}
          onClone={(taskId) => void cloneTask(taskId)}
          onDelete={(taskId) => void deleteTask(taskId)}
        />
        {members.map((member) => {
          const columnTasks = tasks.filter((t) => t.assigneeId === member.id);

          return (
            <TaskColumn
              key={member.id}
              assigneeId={member.id}
              assigneeName={groupMemberLabel(member)}
              header={
                <MemberColumnHeader
                  member={member}
                  locale={locale}
                  labels={labels}
                  linkToProfile={linkMemberProfiles}
                />
              }
              tasks={columnTasks}
              locale={locale}
              scope={scope}
              view={view} project={project}
              labels={labels}
              editable={columnEditable(member.id)}
              draggingTaskId={draggingTaskId}
              activeDropTarget={activeDropTarget}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onSectionDragOver={setActiveDropTarget}
              onDrop={handleSectionDrop}
              onPlaceInTodo={placeInTodo}
              onAssignToColumn={assignToColumn}
              onUpdateFields={handleUpdateFields}
              onQuickCreate={handleQuickCreate}
              onClone={(taskId) => void cloneTask(taskId)}
              onDelete={(taskId) => void deleteTask(taskId)}
            />
          );
        })}
      </div>
    </>
  );
}
