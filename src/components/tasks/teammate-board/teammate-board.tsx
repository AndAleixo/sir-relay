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
import { ToneBadge } from "@/components/ui/badge";
import {
  OperatorBoardTaskCard,
  type TaskCardLabels,
} from "@/components/tasks/task-card";
import { TodoReorderList, resolveTodoDropIndex } from "@/components/tasks/todo-reorder-list";
import { BoardQuickAddTask } from "@/components/tasks/board-quick-add-task";
import {
  DEFAULT_BOARD_SECTION_SCROLL_AFTER,
  sectionListMaxHeight,
} from "./board-section-scroll";
import { teamBoardStyles } from "./teammate-board.styles";

interface BoardOperator {
  id: string;
  name: string;
  email?: string;
  displayName?: string | null;
  telegramStatus?: "linked" | "pending";
}

interface TeammateBoardProps {
  operator: BoardOperator;
  /** Other group members (teammates + other operators), excluding the logged-in operator. */
  members: OrganizationUser[];
  tasks: Task[];
  locale: string;
  labels: TaskCardLabels & {
    sectionTodo: string;
    sectionDoing: string;
    sectionDone: string;
    startDoing: string;
    markDone: string;
    completedMark: string;
    linked: string;
    pending: string;
    invited: string;
    active: string;
    operatorRole: string;
    viewAll: string;
    emptyBoard: string;
    dragHandle: string;
    openTask: string;
    addTask: string;
    addDueDate: string;
    titlePlaceholder: string;
  };
  /** Scroll inside To do / In progress / Done when count exceeds this (default 4). */
  sectionScrollAfter?: number;
}

function SectionCardList({
  itemCount,
  scrollAfter,
  todoScroll,
  children,
}: {
  itemCount: number;
  scrollAfter: number;
  /** Edge auto-scroll target for TodoReorderList only. */
  todoScroll?: boolean;
  children: React.ReactNode;
}) {
  const maxHeight = sectionListMaxHeight(itemCount, scrollAfter);

  return (
    <div
      data-no-drag-scroll
      data-todo-scroll={todoScroll ? "" : undefined}
      className={cn(
        teamBoardStyles.cardList,
        maxHeight !== undefined && teamBoardStyles.cardListScrollable,
      )}
      style={maxHeight !== undefined ? { maxHeight } : undefined}
    >
      {children}
    </div>
  );
}

function BoardTaskItem({
  task,
  locale,
  labels,
  draggingTaskId,
  isQueueHead,
  showCompletedMark,
  onDragStart,
  onDragEnd,
  onUpdateFields,
  onStartDoing,
  onMarkDone,
}: {
  task: Task;
  locale: string;
  labels: TeammateBoardProps["labels"];
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
}) {
  const cardLabels: TaskCardLabels & {
    dragHandle: string;
    openTask: string;
    addDueDate: string;
    startDoing: string;
    markDone: string;
    completedMark: string;
  } = {
    dueDate: labels.dueDate,
    overdue: labels.overdue,
    dragHandle: labels.dragHandle,
    openTask: labels.openTask,
    addDueDate: labels.addDueDate,
    startDoing: labels.startDoing,
    markDone: labels.markDone,
    completedMark: labels.completedMark,
  };

  return (
    <OperatorBoardTaskCard
      task={task}
      locale={locale}
      href={`/${locale}/tasks/${task.id}`}
      labels={cardLabels}
      isDragging={draggingTaskId === task.id}
      isQueueHead={isQueueHead}
      showCompletedMark={showCompletedMark}
      onDragHandleStart={() => onDragStart(task.id)}
      onDragHandleEnd={onDragEnd}
      onUpdateFields={(fields) => onUpdateFields(task.id, fields)}
      onStartDoing={onStartDoing}
      onMarkDone={onMarkDone}
    />
  );
}

function DroppableSection({
  title,
  accent,
  assigneeId,
  status,
  activeDropTarget,
  onSectionDragOver,
  onDrop,
  footer,
  itemCount,
  scrollAfter,
  children,
}: {
  title: string;
  accent?: boolean;
  assigneeId: string;
  status: TaskStatus;
  activeDropTarget: string | null;
  onSectionDragOver: (key: string) => void;
  onDrop: (
    assigneeId: string,
    status: TaskStatus,
    event: DragEvent<HTMLElement>,
  ) => void;
  footer?: React.ReactNode;
  itemCount: number;
  scrollAfter: number;
  children: React.ReactNode;
}) {
  const key = dropTargetKey(assigneeId, status);

  return (
    <section
      className={cn(
        teamBoardStyles.section,
        activeDropTarget === key && teamBoardStyles.sectionDropTarget,
      )}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";
        onSectionDragOver(key);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDrop(assigneeId, status, event);
      }}
    >
      <h3 className={accent ? teamBoardStyles.sectionTitleAccent : teamBoardStyles.sectionTitle}>
        {title}
      </h3>
      <SectionCardList
        itemCount={itemCount}
        scrollAfter={scrollAfter}
        todoScroll={status === "todo"}
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
  labels,
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
  sectionScrollAfter,
}: {
  assigneeId: string;
  assigneeName: string;
  header: React.ReactNode;
  tasks: Task[];
  locale: string;
  labels: TeammateBoardProps["labels"];
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
  sectionScrollAfter: number;
}) {
  const [doneOpen, setDoneOpen] = useState(false);
  const grouped = groupTasksByStatusOrdered(tasks);
  const donePreview = grouped.done.slice(-5);
  const doneKey = dropTargetKey(assigneeId, "done");

  return (
    <article className={teamBoardStyles.column}>
      <header className={teamBoardStyles.columnHeader}>{header}</header>

      <DroppableSection
        title={`${labels.sectionTodo} (${grouped.todo.length})`}
        assigneeId={assigneeId}
        status="todo"
        activeDropTarget={activeDropTarget}
        onSectionDragOver={onSectionDragOver}
        onDrop={onDrop}
        itemCount={grouped.todo.length}
        scrollAfter={sectionScrollAfter}
        footer={
          <BoardQuickAddTask
            assigneeId={assigneeId}
            assigneeName={assigneeName}
            addLabel={labels.addTask}
            titlePlaceholder={labels.titlePlaceholder}
            onCreate={onQuickCreate}
          />
        }
      >
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
              />
            ),
          }))}
        />
      </DroppableSection>

      <DroppableSection
        title={`${labels.sectionDoing} (${grouped.doing.length})`}
        accent
        assigneeId={assigneeId}
        status="doing"
        activeDropTarget={activeDropTarget}
        onSectionDragOver={onSectionDragOver}
        onDrop={onDrop}
        itemCount={grouped.doing.length}
        scrollAfter={sectionScrollAfter}
      >
        {grouped.doing.map((task) => (
          <BoardTaskItem
            key={task.id}
            task={task}
            locale={locale}
            labels={labels}
            draggingTaskId={draggingTaskId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onUpdateFields={onUpdateFields}
            onMarkDone={() => onAssignToColumn(assigneeId, "done", task.id)}
          />
        ))}
      </DroppableSection>

      <div
        className={cn(
          teamBoardStyles.doneSection,
          activeDropTarget === doneKey && teamBoardStyles.sectionDropTarget,
        )}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = "move";
          onSectionDragOver(doneKey);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const taskId = getTaskIdFromDragEvent(event);
          onDragEnd();
          if (taskId) void onAssignToColumn(assigneeId, "done", taskId);
        }}
      >
        <button
          type="button"
          className={teamBoardStyles.doneToggle}
          onClick={() => setDoneOpen((open) => !open)}
        >
          <span>{doneOpen ? "▾" : "▸"}</span>
          {labels.sectionDone} ({grouped.done.length})
        </button>
        {doneOpen && (
          <SectionCardList
            itemCount={donePreview.length}
            scrollAfter={sectionScrollAfter}
          >
            {donePreview.map((task) => (
              <BoardTaskItem
                key={task.id}
                task={task}
                locale={locale}
                labels={labels}
                draggingTaskId={draggingTaskId}
                showCompletedMark
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onUpdateFields={onUpdateFields}
              />
            ))}
            {grouped.done.length > 5 && (
              <p className={teamBoardStyles.viewAll}>{labels.viewAll}</p>
            )}
          </SectionCardList>
        )}
      </div>
    </article>
  );
}

function MemberColumnHeader({
  member,
  locale,
  labels,
  activeCount,
}: {
  member: {
    id: string;
    name: string;
    email: string;
    displayName?: string | null;
    role: "operator" | "teammate";
    telegramStatus?: "linked" | "pending";
    accountStatus?: "active" | "invited" | null;
  };
  locale: string;
  labels: TeammateBoardProps["labels"];
  activeCount: number;
}) {
  const telegramStatus = member.telegramStatus;
  const accountStatus =
    member.role === "teammate" ? member.accountStatus : null;

  return (
    <>
      <Link
        href={`/${locale}/teammates/${member.id}`}
        className={teamBoardStyles.teammateName}
      >
        {groupMemberLabel(member)}
      </Link>
      <div className={teamBoardStyles.badges}>
        {member.role === "operator" ? (
          <ToneBadge tone="neutral">{labels.operatorRole}</ToneBadge>
        ) : null}
        {telegramStatus ? (
          <ToneBadge tone={telegramStatus === "linked" ? "success" : "warning"}>
            {telegramStatus === "linked" ? labels.linked : labels.pending}
          </ToneBadge>
        ) : null}
        {accountStatus ? (
          <ToneBadge tone="neutral">
            {accountStatus === "active" ? labels.active : labels.invited}
          </ToneBadge>
        ) : null}
      </div>
      <p className={teamBoardStyles.activeCount}>{activeCount} active</p>
    </>
  );
}

export function TeammateBoard({
  operator,
  members,
  tasks,
  locale,
  labels,
  sectionScrollAfter = DEFAULT_BOARD_SECTION_SCROLL_AFTER,
}: TeammateBoardProps) {
  const { applyTaskUpdate, createTaskQuick, placeInTodoQueue } = useSync();
  const { scrollRef, scrollHandlers } = useHorizontalDragScroll();
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);

  const assigneeById: Record<string, { id: string; name: string }> = {
    [operator.id]: {
      id: operator.id,
      name: groupMemberLabel({
        name: operator.name,
        email: operator.email ?? "",
        displayName: operator.displayName,
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

  function handleQuickCreate(input: {
    title: string;
    assigneeId: string;
    assigneeName: string;
  }) {
    return createTaskQuick(locale, input);
  }

  const selfTasks = tasks.filter((t) => t.assigneeId === operator.id);
  const selfActive =
    selfTasks.filter((t) => t.status === "todo" || t.status === "doing").length;

  const todoCountByAssignee = new Map<string, number>();
  for (const task of tasks) {
    if (task.status !== "todo") continue;
    todoCountByAssignee.set(
      task.assigneeId,
      (todoCountByAssignee.get(task.assigneeId) ?? 0) + 1,
    );
  }
  // Self stays first; others by To do count (desc), then name.
  const membersByTodoLoad = [...members].sort((a, b) => {
    const byCount =
      (todoCountByAssignee.get(b.id) ?? 0) -
      (todoCountByAssignee.get(a.id) ?? 0);
    if (byCount !== 0) return byCount;
    return groupMemberLabel(a).localeCompare(groupMemberLabel(b));
  });

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
          assigneeId={operator.id}
          assigneeName={groupMemberLabel({
            name: operator.name,
            email: operator.email ?? "",
            displayName: operator.displayName,
          })}
          header={
            <MemberColumnHeader
              member={{
                id: operator.id,
                name: operator.name,
                email: operator.email ?? "",
                displayName: operator.displayName,
                role: "operator",
                telegramStatus: operator.telegramStatus,
              }}
              locale={locale}
              labels={labels}
              activeCount={selfActive}
            />
          }
          tasks={selfTasks}
          locale={locale}
          labels={labels}
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
          sectionScrollAfter={sectionScrollAfter}
        />
        {membersByTodoLoad.map((member) => {
          const columnTasks = tasks.filter((t) => t.assigneeId === member.id);
          const activeCount =
            columnTasks.filter((t) => t.status === "todo" || t.status === "doing").length;

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
                  activeCount={activeCount}
                />
              }
              tasks={columnTasks}
              locale={locale}
              labels={labels}
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
              sectionScrollAfter={sectionScrollAfter}
            />
          );
        })}
      </div>
    </>
  );
}
