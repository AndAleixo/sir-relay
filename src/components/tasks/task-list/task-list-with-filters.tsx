"use client";

import { useMemo, useState } from "react";
import type { ManagedProject, Task, TaskStatus } from "@/domain/types";
import type { TasksScope, TasksView } from "@/lib/tasks-url";
import { sortTasksForList, type TaskListSort } from "@/lib/task-list-sort";
import { cn } from "@/lib/cn";
import { TaskList } from "@/components/tasks/task-list";
import { taskListStyles } from "./task-list.styles";
import { Select } from "@/components/ui/input";

type AssigneeFilterOption = {
  id: string;
  label: string;
};

type TaskListWithFiltersProps = {
  tasks: Task[];
  locale: string;
  scope: TasksScope;
  view: TasksView;
  project?: string | null;
  /** Open projects for inline list editors (project stays in the toolbar). */
  openProjects?: ManagedProject[];
  currentUserId: string;
  canEditAll: boolean;
  assigneeOptions?: AssigneeFilterOption[];
  labels: {
    title: string;
    assignee: string;
    dueDate: string;
    addDueDate: string;
    statusColumn: string;
    filterAssignee: string;
    filterStatus: string;
    filterSort: string;
    filterAll: string;
    sortDue: string;
    sortUpdated: string;
    status: Record<TaskStatus, string>;
    project: string;
    category: string;
    projectNone: string;
    categoryNone: string;
  };
};

export function TaskListWithFilters({
  tasks,
  locale,
  scope,
  view,
  project = null,
  openProjects = [],
  currentUserId,
  canEditAll,
  assigneeOptions = [],
  labels,
}: TaskListWithFiltersProps) {
  const [assigneeId, setAssigneeId] = useState("all");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [sort, setSort] = useState<TaskListSort>("due");
  const showAssigneeFilter = scope === "team" && assigneeOptions.length > 0;

  const assigneeSelectOptions = useMemo(
    () => [
      {
        value: "all",
        label: labels.filterAll,
        compactLabel: labels.assignee,
      },
      ...assigneeOptions.map((option) => ({
        value: option.id,
        label: option.label,
      })),
    ],
    [assigneeOptions, labels.filterAll, labels.assignee],
  );

  const statusSelectOptions = useMemo(
    () => [
      {
        value: "all",
        label: labels.filterAll,
        compactLabel: labels.statusColumn,
      },
      { value: "todo", label: labels.status.todo },
      { value: "doing", label: labels.status.doing },
      { value: "done", label: labels.status.done },
    ],
    [labels.filterAll, labels.status, labels.statusColumn],
  );

  const sortSelectOptions = useMemo(
    () => [
      { value: "due", label: labels.sortDue },
      { value: "status", label: labels.statusColumn },
      { value: "updated", label: labels.sortUpdated },
    ],
    [labels.sortDue, labels.statusColumn, labels.sortUpdated],
  );

  const visible = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (showAssigneeFilter && assigneeId !== "all" && task.assigneeId !== assigneeId) {
        return false;
      }
      if (status !== "all" && task.status !== status) return false;
      return true;
    });
    return sortTasksForList(filtered, sort);
  }, [tasks, assigneeId, status, sort, showAssigneeFilter]);

  return (
    <div className="space-y-4">
      <div className={taskListStyles.filterBar}>
        {showAssigneeFilter ? (
          <div className={taskListStyles.filterFieldWide}>
            <Select
              id="filter-assignee"
              className={taskListStyles.filterSelect}
              triggerClassName={taskListStyles.filterTrigger}
              value={assigneeId}
              onChange={setAssigneeId}
              options={assigneeSelectOptions}
              aria-label={labels.filterAssignee}
              compactTrigger
            />
          </div>
        ) : null}
        <div className={taskListStyles.filterField}>
          <Select
            id="filter-status"
            className={taskListStyles.filterSelect}
            triggerClassName={taskListStyles.filterTrigger}
            value={status}
            onChange={(next) => setStatus(next as TaskStatus | "all")}
            options={statusSelectOptions}
            aria-label={labels.filterStatus}
            compactTrigger
          />
        </div>
        <div className={cn(taskListStyles.filterField, taskListStyles.filterFieldSort)}>
          <Select
            id="filter-sort"
            className={taskListStyles.filterSelect}
            triggerClassName={taskListStyles.filterTrigger}
            value={sort}
            onChange={(next) => setSort(next as TaskListSort)}
            options={sortSelectOptions}
            aria-label={labels.filterSort}
            compactTrigger
          />
        </div>
      </div>
      <TaskList
        tasks={visible}
        locale={locale}
        scope={scope}
        view={view}
        project={project}
        currentUserId={currentUserId}
        canEditAll={canEditAll}
        openProjects={openProjects}
        assigneeOptions={assigneeOptions}
        labels={{
          title: labels.title,
          assignee: labels.assignee,
          dueDate: labels.dueDate,
          addDueDate: labels.addDueDate,
          statusColumn: labels.statusColumn,
          status: labels.status,
          project: labels.project,
          category: labels.category,
          projectNone: labels.projectNone,
          categoryNone: labels.categoryNone,
        }}
      />
    </div>
  );
}
