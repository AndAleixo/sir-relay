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
  project: string | null;
  isOperator: boolean;
  assigneeOptions: TaskFormAssigneeOption[];
  projectOptions: { id: string; label: string }[];
  labels: TaskFormLabels & { save: string; cancel: string };
};

export function CreateTaskForm({
  locale,
  scope,
  view,
  project,
  isOperator,
  assigneeOptions,
  projectOptions,
  labels,
}: CreateTaskFormProps) {
  const createAction = createTaskForm.bind(null, locale);
  const { save, cancel, ...fieldLabels } = labels;

  return (
    <form action={createAction} className="space-y-4">
      <input type="hidden" name="returnScope" value={scope} />
      <input type="hidden" name="returnView" value={view} />
      <input type="hidden" name="returnProject" value={project ?? ""} />
      <TaskFormFields
        mode="create"
        labels={fieldLabels}
        isOperator={isOperator}
        assigneeOptions={assigneeOptions}
        projectOptions={projectOptions}
        defaultValues={project ? { projectId: project } : undefined}
      />
      <TaskFormActions
        cancelHref={tasksListHref(locale, { scope, view, project })}
        saveLabel={save}
        cancelLabel={cancel}
      />
    </form>
  );
}
