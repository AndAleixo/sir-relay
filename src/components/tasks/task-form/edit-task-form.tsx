"use client";

import { deleteTaskAction, saveTaskDetailAction } from "@/app/actions/tasks";
import {
  TaskFormActions,
  TaskFormFields,
  type TaskFormAssigneeOption,
  type TaskFormLabels,
} from "@/components/tasks/task-form";
import type { Task, TaskStatus } from "@/domain/types";
import type { TasksScope, TasksView } from "@/lib/tasks-url";
import { tasksListHref } from "@/lib/tasks-url";

type EditTaskFormProps = {
  task: Task;
  locale: string;
  scope: TasksScope;
  view: TasksView;
  isOperator: boolean;
  assigneeOptions: TaskFormAssigneeOption[];
  overdue: boolean;
  statusLabels: Record<TaskStatus, string>;
  labels: TaskFormLabels & {
    save: string;
    cancel: string;
    delete: string;
    deleteConfirm: string;
  };
};

export function EditTaskForm({
  task,
  locale,
  scope,
  view,
  isOperator,
  assigneeOptions,
  overdue,
  statusLabels,
  labels,
}: EditTaskFormProps) {
  const saveAction = saveTaskDetailAction.bind(null, locale, task.id);
  const { save, cancel, delete: deleteLabel, deleteConfirm, ...fieldLabels } = labels;
  const listHref = tasksListHref(locale, { scope, view });

  return (
    <form action={saveAction} className="space-y-4">
      <input type="hidden" name="returnScope" value={scope} />
      <input type="hidden" name="returnView" value={view} />
      <TaskFormFields
        mode="edit"
        labels={fieldLabels}
        isOperator={isOperator}
        assigneeOptions={assigneeOptions}
        statusLabels={statusLabels}
        defaultValues={task}
        overdue={overdue}
      />
      <TaskFormActions
        cancelHref={listHref}
        saveLabel={save}
        cancelLabel={cancel}
        deleteLabel={deleteLabel}
        deleteConfirm={deleteConfirm}
        onDelete={() =>
          deleteTaskAction(locale, task.id, { scope, view })
        }
      />
    </form>
  );
}
