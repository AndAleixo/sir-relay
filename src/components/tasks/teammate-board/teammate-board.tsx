"use client";

import { useState } from "react";
import Link from "next/link";
import type { DragEvent } from "react";
import type { Task, TaskStatus } from "@/domain/types";
import type { OrganizationUser } from "@/services/contracts";
import { groupTasksByStatus } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { groupMemberLabel } from "@/lib/group-member-label";
import {
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
import { BoardQuickAddTask } from "./board-quick-add-task";
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
    linked: string;
    pending: string;
    invited: string;
    active: string;
    operatorRole: string;
    viewAll: string;
    emptyBoard: string;
    dragHandle: string;
    meColumn: string;
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
  children,
}: {
  itemCount: number;
  scrollAfter: number;
  children: React.ReactNode;
}) {
  const maxHeight = sectionListMaxHeight(itemCount, scrollAfter);

  return (
    <div
      data-no-drag-scroll
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
  onDragStart,
  onDragEnd,
  onUpdateFields,
}: {
  task: Task;
  locale: string;
  labels: TeammateBoardProps["labels"];
  draggingTaskId: string | null;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onUpdateFields: (
    taskId: string,
    fields: { title?: string; dueDate?: string | null },
  ) => Promise<void>;
}) {
  const cardLabels: TaskCardLabels & {
    dragHandle: string;
    openTask: string;
    addDueDate: string;
  } = {
    dueDate: labels.dueDate,
    updated: labels.updated,
    overdue: labels.overdue,
    dragHandle: labels.dragHandle,
    openTask: labels.openTask,
    addDueDate: labels.addDueDate,
  };

  return (
    <OperatorBoardTaskCard
      task={task}
      locale={locale}
      href={`/${locale}/tasks/${task.id}`}
      labels={cardLabels}
      isDragging={draggingTaskId === task.id}
      onDragHandleStart={() => onDragStart(task.id)}
      onDragHandleEnd={onDragEnd}
      onUpdateFields={(fields) => onUpdateFields(task.id, fields)}
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
      <SectionCardList itemCount={itemCount} scrollAfter={scrollAfter}>
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
  const grouped = groupTasksByStatus(tasks);
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
        {grouped.todo.map((task) => (
          <BoardTaskItem
            key={task.id}
            task={task}
            locale={locale}
            labels={labels}
            draggingTaskId={draggingTaskId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onUpdateFields={onUpdateFields}
          />
        ))}
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
          onDrop(assigneeId, "done", event);
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
  member: OrganizationUser;
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

function SelfColumnHeader({
  operator,
  locale,
  labels,
  activeCount,
}: {
  operator: BoardOperator;
  locale: string;
  labels: TeammateBoardProps["labels"];
  activeCount: number;
}) {
  return (
    <>
      <Link href={`/${locale}/settings`} className={teamBoardStyles.teammateName}>
        {labels.meColumn}
      </Link>
      <p className="text-xs text-[var(--text-muted)]">
        {groupMemberLabel({
          name: operator.name,
          email: operator.email ?? "",
          displayName: operator.displayName,
        })}
      </p>
      <div className={teamBoardStyles.badges}>
        {operator.telegramStatus ? (
          <ToneBadge
            tone={operator.telegramStatus === "linked" ? "success" : "warning"}
          >
            {operator.telegramStatus === "linked" ? labels.linked : labels.pending}
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
  const { applyTaskUpdate, createTaskQuick } = useSync();
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
  }

  async function handleSectionDrop(
    targetAssigneeId: string,
    targetStatus: TaskStatus,
    event: DragEvent<HTMLElement>,
  ) {
    const taskId = getTaskIdFromDragEvent(event);
    handleDragEnd();

    if (!taskId) return;

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
            <SelfColumnHeader
              operator={operator}
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
          onUpdateFields={handleUpdateFields}
          onQuickCreate={handleQuickCreate}
          sectionScrollAfter={sectionScrollAfter}
        />
        {members.map((member) => {
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
