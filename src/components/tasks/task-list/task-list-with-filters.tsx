"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ManagedProject, Task, TaskStatus } from "@/domain/types";
import type { TasksScope, TasksView } from "@/lib/tasks-url";
import { sortTasksForList, type TaskListSort } from "@/lib/task-list-sort";
import { TaskList } from "@/components/tasks/task-list";
import { taskListStyles } from "./task-list.styles";
import { Label, Select } from "@/components/ui/input";

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
  projects?: ManagedProject[];
  onProjectChange?: (projectId: string | null) => void;
  addProjectHref?: string;
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
    addProject: string;
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
  projects = [],
  onProjectChange,
  addProjectHref,
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
      { value: "all", label: labels.filterAll },
      ...assigneeOptions.map((option) => ({
        value: option.id,
        label: option.label,
      })),
    ],
    [assigneeOptions, labels.filterAll],
  );

  const statusSelectOptions = useMemo(
    () => [
      { value: "all", label: labels.filterAll },
      { value: "todo", label: labels.status.todo },
      { value: "doing", label: labels.status.doing },
      { value: "done", label: labels.status.done },
    ],
    [labels.filterAll, labels.status],
  );

  const sortSelectOptions = useMemo(
    () => [
      { value: "due", label: labels.sortDue },
      { value: "status", label: labels.statusColumn },
      { value: "updated", label: labels.sortUpdated },
    ],
    [labels.sortDue, labels.statusColumn, labels.sortUpdated],
  );

  const projectSelectOptions = useMemo(
    () => [
      { value: "", label: labels.filterAll },
      ...projects.map((row) => ({
        value: row.id,
        label: row.acronym,
      })),
    ],
    [projects, labels.filterAll],
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
        {projects.length > 0 && onProjectChange ? (
          <div className={taskListStyles.filterField}>
            <Label htmlFor="filter-project" className={taskListStyles.filterLabel}>
              {labels.project}
            </Label>
            <Select
              id="filter-project"
              className={taskListStyles.filterSelect}
              value={project ?? ""}
              onChange={(next) => onProjectChange(next || null)}
              options={projectSelectOptions}
              aria-label={labels.project}
            />
          </div>
        ) : addProjectHref ? (
          <p className={taskListStyles.filterAdd}>
            <Link
              href={addProjectHref}
              className="underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
            >
              {labels.addProject}
            </Link>
          </p>
        ) : null}
        {showAssigneeFilter ? (
          <div className={taskListStyles.filterFieldWide}>
            <Label htmlFor="filter-assignee" className={taskListStyles.filterLabel}>
              {labels.filterAssignee}
            </Label>
            <Select
              id="filter-assignee"
              className={taskListStyles.filterSelect}
              value={assigneeId}
              onChange={setAssigneeId}
              options={assigneeSelectOptions}
              aria-label={labels.filterAssignee}
            />
          </div>
        ) : null}
        <div className={taskListStyles.filterField}>
          <Label htmlFor="filter-status" className={taskListStyles.filterLabel}>
            {labels.filterStatus}
          </Label>
          <Select
            id="filter-status"
            className={taskListStyles.filterSelect}
            value={status}
            onChange={(next) => setStatus(next as TaskStatus | "all")}
            options={statusSelectOptions}
            aria-label={labels.filterStatus}
          />
        </div>
        <div className={taskListStyles.filterField}>
          <Label htmlFor="filter-sort" className={taskListStyles.filterLabel}>
            {labels.filterSort}
          </Label>
          <Select
            id="filter-sort"
            className={taskListStyles.filterSelect}
            value={sort}
            onChange={(next) => setSort(next as TaskListSort)}
            options={sortSelectOptions}
            aria-label={labels.filterSort}
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
        openProjects={projects}
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
