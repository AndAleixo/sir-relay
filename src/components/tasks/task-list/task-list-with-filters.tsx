"use client";

import { useMemo, useState } from "react";
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
  assigneeOptions?: AssigneeFilterOption[];
  labels: {
    titleColumn: string;
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
    sortStatus: string;
    sortUpdated: string;
    status: Record<TaskStatus, string>;
  };
};

export function TaskListWithFilters({
  tasks,
  locale,
  scope,
  view,
  assigneeOptions = [],
  labels,
}: TaskListWithFiltersProps) {
  const [assigneeId, setAssigneeId] = useState("all");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [sort, setSort] = useState<TaskListSort>("due");
  const showAssigneeFilter = assigneeOptions.length > 0;

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
        {showAssigneeFilter ? (
          <div className="min-w-[180px]">
            <Label htmlFor="filter-assignee">{labels.filterAssignee}</Label>
            <Select
              id="filter-assignee"
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              className="mt-1.5"
            >
              <option value="all">{labels.filterAll}</option>
              {assigneeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <div className="min-w-[160px]">
          <Label htmlFor="filter-status">{labels.filterStatus}</Label>
          <Select
            id="filter-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus | "all")}
            className="mt-1.5"
          >
            <option value="all">{labels.filterAll}</option>
            <option value="todo">{labels.status.todo}</option>
            <option value="doing">{labels.status.doing}</option>
            <option value="done">{labels.status.done}</option>
          </Select>
        </div>
        <div className="min-w-[160px]">
          <Label htmlFor="filter-sort">{labels.filterSort}</Label>
          <Select
            id="filter-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as TaskListSort)}
            className="mt-1.5"
          >
            <option value="due">{labels.sortDue}</option>
            <option value="status">{labels.sortStatus}</option>
            <option value="updated">{labels.sortUpdated}</option>
          </Select>
        </div>
      </div>
      <TaskList
        tasks={visible}
        locale={locale}
        scope={scope}
        view={view}
        showAssignee={showAssigneeFilter}
        labels={{
          titleColumn: labels.titleColumn,
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
