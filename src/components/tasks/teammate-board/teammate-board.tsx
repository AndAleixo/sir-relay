"use client";

import { useState } from "react";
import Link from "next/link";
import type { DragEvent } from "react";
import type { Task, TaskStatus, Teammate } from "@/domain/types";
import { groupTasksByStatus } from "@/lib/dates";
import { cn } from "@/lib/cn";
import {
  dropTargetKey,
  getTaskIdFromDragEvent,
} from "@/lib/task-drag";
import type { MutationInput } from "@/domain/sync";
import { useSync } from "@/components/sync";
import { ToneBadge } from "@/components/ui/badge";
import {
  DraggableTaskCard,
  type TaskCardLabels,
} from "@/components/tasks/task-card";
import { teamBoardStyles } from "./teammate-board.styles";

interface TeammateBoardProps {
  teammates: Teammate[];
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
    viewAll: string;
    emptyBoard: string;
    dragHint: string;
    dragHandle: string;
  };
}

function BoardTaskItem({
  task,
  locale,
  labels,
  draggingTaskId,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  locale: string;
  labels: TaskCardLabels & { dragHandle: string };
  draggingTaskId: string | null;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
}) {
  return (
    <DraggableTaskCard
      task={task}
      locale={locale}
      href={`/${locale}/tasks/${task.id}`}
      labels={labels}
      dragHandleLabel={labels.dragHandle}
      isDragging={draggingTaskId === task.id}
      onDragHandleStart={() => onDragStart(task.id)}
      onDragHandleEnd={onDragEnd}
    />
  );
}

function DroppableSection({
  title,
  accent,
  teammateId,
  status,
  activeDropTarget,
  onSectionDragOver,
  onDrop,
  children,
}: {
  title: string;
  accent?: boolean;
  teammateId: string;
  status: TaskStatus;
  activeDropTarget: string | null;
  onSectionDragOver: (key: string) => void;
  onDrop: (
    teammateId: string,
    status: TaskStatus,
    event: DragEvent<HTMLElement>,
  ) => void;
  children: React.ReactNode;
}) {
  const key = dropTargetKey(teammateId, status);

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
        onDrop(teammateId, status, event);
      }}
    >
      <h3 className={accent ? teamBoardStyles.sectionTitleAccent : teamBoardStyles.sectionTitle}>
        {title}
      </h3>
      <div className={teamBoardStyles.cardList}>{children}</div>
    </section>
  );
}

function TeammateColumn({
  teammate,
  tasks,
  locale,
  labels,
  draggingTaskId,
  activeDropTarget,
  onDragStart,
  onDragEnd,
  onSectionDragOver,
  onDrop,
}: {
  teammate: Teammate;
  tasks: Task[];
  locale: string;
  labels: TeammateBoardProps["labels"];
  draggingTaskId: string | null;
  activeDropTarget: string | null;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onSectionDragOver: (key: string) => void;
  onDrop: (
    teammateId: string,
    status: TaskStatus,
    event: DragEvent<HTMLElement>,
  ) => void;
}) {
  const [doneOpen, setDoneOpen] = useState(false);
  const grouped = groupTasksByStatus(tasks);
  const donePreview = grouped.done.slice(-5);
  const doneKey = dropTargetKey(teammate.id, "done");

  const cardLabels: TaskCardLabels & { dragHandle: string } = {
    dueDate: labels.dueDate,
    updated: labels.updated,
    overdue: labels.overdue,
    dragHandle: labels.dragHandle,
  };

  return (
    <article className={teamBoardStyles.column}>
      <header className={teamBoardStyles.columnHeader}>
        <Link
          href={`/${locale}/teammates/${teammate.id}`}
          className={teamBoardStyles.teammateName}
        >
          {teammate.name}
        </Link>
        <div className={teamBoardStyles.badges}>
          <ToneBadge tone={teammate.telegramStatus === "linked" ? "success" : "warning"}>
            {teammate.telegramStatus === "linked" ? labels.linked : labels.pending}
          </ToneBadge>
          <ToneBadge tone="neutral">
            {teammate.accountStatus === "active" ? labels.active : labels.invited}
          </ToneBadge>
        </div>
        <p className={teamBoardStyles.activeCount}>
          {grouped.todo.length + grouped.doing.length} active
        </p>
      </header>

      <DroppableSection
        title={`${labels.sectionTodo} (${grouped.todo.length})`}
        teammateId={teammate.id}
        status="todo"
        activeDropTarget={activeDropTarget}
        onSectionDragOver={onSectionDragOver}
        onDrop={onDrop}
      >
        {grouped.todo.map((task) => (
          <BoardTaskItem
            key={task.id}
            task={task}
            locale={locale}
            labels={cardLabels}
            draggingTaskId={draggingTaskId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </DroppableSection>

      <DroppableSection
        title={`${labels.sectionDoing} (${grouped.doing.length})`}
        accent
        teammateId={teammate.id}
        status="doing"
        activeDropTarget={activeDropTarget}
        onSectionDragOver={onSectionDragOver}
        onDrop={onDrop}
      >
        {grouped.doing.map((task) => (
          <BoardTaskItem
            key={task.id}
            task={task}
            locale={locale}
            labels={cardLabels}
            draggingTaskId={draggingTaskId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
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
          onDrop(teammate.id, "done", event);
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
          <div className={teamBoardStyles.cardList}>
            {donePreview.map((task) => (
              <BoardTaskItem
                key={task.id}
                task={task}
                locale={locale}
                labels={cardLabels}
                draggingTaskId={draggingTaskId}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            ))}
            {grouped.done.length > 5 && (
              <p className={teamBoardStyles.viewAll}>{labels.viewAll}</p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function TeammateBoard({
  teammates,
  tasks,
  locale,
  labels,
}: TeammateBoardProps) {
  const { applyTaskUpdate } = useSync();
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);

  const teammateById = Object.fromEntries(teammates.map((t) => [t.id, t]));

  function handleDragStart(taskId: string) {
    setDraggingTaskId(taskId);
  }

  function handleDragEnd() {
    setDraggingTaskId(null);
    setActiveDropTarget(null);
  }

  async function handleSectionDrop(
    targetTeammateId: string,
    targetStatus: TaskStatus,
    event: DragEvent<HTMLElement>,
  ) {
    const taskId = getTaskIdFromDragEvent(event);
    handleDragEnd();

    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    const target = teammateById[targetTeammateId];
    if (!task || !target) return;

    const needsReassign = task.assigneeId !== targetTeammateId;
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

  if (teammates.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-[var(--border)] bg-surface-card p-8 text-center text-sm text-[var(--text-muted)]">
        {labels.emptyBoard}
      </p>
    );
  }

  return (
    <>
      <p className={teamBoardStyles.dragHint}>{labels.dragHint}</p>
      <div className={teamBoardStyles.scroll}>
        {teammates.map((teammate) => (
          <TeammateColumn
            key={teammate.id}
            teammate={teammate}
            tasks={tasks.filter((t) => t.assigneeId === teammate.id)}
            locale={locale}
            labels={labels}
            draggingTaskId={draggingTaskId}
            activeDropTarget={activeDropTarget}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onSectionDragOver={setActiveDropTarget}
            onDrop={handleSectionDrop}
          />
        ))}
      </div>
    </>
  );
}
