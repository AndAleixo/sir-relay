"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Task, TaskStatus } from "@/domain/types";
import type { TasksScope, TasksView } from "@/lib/tasks-url";
import { sortTasksForList, type TaskListSort } from "@/lib/task-list-sort";
import { TaskList } from "@/components/tasks/task-list";
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
  projects?: { id: string; acronym: string }[];
  onProjectChange?: (projectId: string | null) => void;
  addProjectHref?: string;
  assigneeOptions?: AssigneeFilterOption[];
  labels: {
    title: string;
    assignee: string;
    dueDate: string;
    updated: string;
    overdue: string;
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
  assigneeOptions = [],
  labels,
}: TaskListWithFiltersProps) {
  const [assigneeId, setAssigneeId] = useState("all");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [sort, setSort] = useState<TaskListSort>("due");
  const showAssigneeFilter = assigneeOptions.length > 0;

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
      <div className="flex flex-wrap gap-4">
        {projects.length > 0 && onProjectChange ? (
          <div className="min-w-[140px]">
            <Label htmlFor="filter-project">{labels.project}</Label>
            <Select
              id="filter-project"
              className="mt-1.5"
              value={project ?? ""}
              onChange={(next) => onProjectChange(next || null)}
              options={projectSelectOptions}
              aria-label={labels.project}
            />
          </div>
        ) : addProjectHref ? (
          <p className="self-end text-xs text-[var(--text-muted)]">
            <Link
              href={addProjectHref}
              className="underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
            >
              {labels.addProject}
            </Link>
          </p>
        ) : null}
        {showAssigneeFilter ? (
          <div className="min-w-[180px]">
            <Label htmlFor="filter-assignee">{labels.filterAssignee}</Label>
            <Select
              id="filter-assignee"
              className="mt-1.5"
              value={assigneeId}
              onChange={setAssigneeId}
              options={assigneeSelectOptions}
              aria-label={labels.filterAssignee}
            />
          </div>
        ) : null}
        <div className="min-w-[160px]">
          <Label htmlFor="filter-status">{labels.filterStatus}</Label>
          <Select
            id="filter-status"
            className="mt-1.5"
            value={status}
            onChange={(next) => setStatus(next as TaskStatus | "all")}
            options={statusSelectOptions}
            aria-label={labels.filterStatus}
          />
        </div>
        <div className="min-w-[160px]">
          <Label htmlFor="filter-sort">{labels.filterSort}</Label>
          <Select
            id="filter-sort"
            className="mt-1.5"
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
        showAssignee={showAssigneeFilter}
        labels={{
          title: labels.title,
          assignee: labels.assignee,
          dueDate: labels.dueDate,
          updated: labels.updated,
          overdue: labels.overdue,
          statusColumn: labels.statusColumn,
          status: labels.status,
        }}
      />
    </div>
  );
}
