"use client";

import { createTaskForm } from "@/app/actions/tasks";
import {
  TaskFormActions,
  TaskFormFields,
  type TaskFormAssigneeOption,
  type TaskFormLabels,
} from "@/components/tasks/task-form";
import type { TasksScope, TasksView } from "@/lib/tasks-url";
import { tasksListHref } from "@/lib/tasks-url";

type CreateTaskFormProps = {
  locale: string;
  scope: TasksScope;
  view: TasksView;
  isOperator: boolean;
  assigneeOptions: TaskFormAssigneeOption[];
  labels: TaskFormLabels & { save: string; cancel: string };
};

export function CreateTaskForm({
  locale,
  scope,
  view,
  isOperator,
  assigneeOptions,
  labels,
}: CreateTaskFormProps) {
  const createAction = createTaskForm.bind(null, locale);
  const { save, cancel, ...fieldLabels } = labels;

  return (
    <form action={createAction} className="space-y-4">
      <input type="hidden" name="returnScope" value={scope} />
      <input type="hidden" name="returnView" value={view} />
      <TaskFormFields
        mode="create"
        labels={fieldLabels}
        isOperator={isOperator}
        assigneeOptions={assigneeOptions}
      />
      <TaskFormActions
        cancelHref={tasksListHref(locale, { scope, view })}
        saveLabel={save}
        cancelLabel={cancel}
      />
    </form>
  );
}
