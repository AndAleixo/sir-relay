"use client";

import Link from "next/link";
import type { Task, TaskStatus } from "@/domain/types";
import type { TasksScope, TasksView } from "@/lib/tasks-url";
import { taskDetailHref } from "@/lib/tasks-url";
import { formatDueDate, formatRelativeTime, isOverdue } from "@/lib/dates";
import { StatusBadge } from "@/components/ui/badge";
import { taskListStyles } from "./task-list.styles";

interface TaskListProps {
  tasks: Task[];
  locale: string;
  scope: TasksScope;
  view: TasksView;
  showAssignee: boolean;
  labels: {
    title: string;
    assignee: string;
    dueDate: string;
    updated: string;
    overdue: string;
    statusColumn: string;
    status: Record<TaskStatus, string>;
  };
}

export function TaskList({
  tasks,
  locale,
  scope,
  view,
  showAssignee,
  labels,
}: TaskListProps) {
  return (
    <div className={taskListStyles.wrapper}>
      <table className={taskListStyles.table}>
        <thead>
          <tr className={taskListStyles.headRow}>
            <th className={taskListStyles.th}>{labels.title}</th>
            {showAssignee && <th className={taskListStyles.th}>{labels.assignee}</th>}
            <th className={taskListStyles.th}>{labels.statusColumn}</th>
            <th className={taskListStyles.th}>{labels.dueDate}</th>
            <th className={taskListStyles.th}>{labels.updated}</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const overdue = isOverdue(task.dueDate);
            return (
              <tr key={task.id} className={taskListStyles.row}>
                <td className={taskListStyles.td}>
                  <Link
                    href={taskDetailHref(locale, task.id, { scope, view })}
                    className={taskListStyles.link}
                  >
                    {task.title}
                  </Link>
                </td>
                {showAssignee && (
                  <td className={taskListStyles.tdMuted}>{task.assigneeName}</td>
                )}
                <td className={taskListStyles.td}>
                  <StatusBadge status={task.status} label={labels.status[task.status]} />
                </td>
                <td className={overdue ? taskListStyles.tdOverdue : taskListStyles.tdMuted}>
                  {formatDueDate(task.dueDate, locale)}
                  {overdue && ` (${labels.overdue})`}
                </td>
                <td className={taskListStyles.tdMuted}>
                  {formatRelativeTime(task.updatedAt, locale)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
