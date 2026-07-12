"use client";

import { createTaskForm } from "@/app/actions/tasks";
import {
  TaskFormActions,
  TaskFormFields,
  type TaskFormAssigneeOption,
  type TaskFormLabels,
} from "@/components/tasks/task-form";

type CreateTaskFormProps = {
  locale: string;
  isOperator: boolean;
  assigneeOptions: TaskFormAssigneeOption[];
  labels: TaskFormLabels & { save: string; cancel: string };
};

export function CreateTaskForm({
  locale,
  isOperator,
  assigneeOptions,
  labels,
}: CreateTaskFormProps) {
  const createAction = createTaskForm.bind(null, locale);
  const { save, cancel, ...fieldLabels } = labels;

  return (
    <form action={createAction} className="space-y-4">
      <TaskFormFields
        mode="create"
        labels={fieldLabels}
        isOperator={isOperator}
        assigneeOptions={assigneeOptions}
      />
      <TaskFormActions
        locale={locale}
        saveLabel={save}
        cancelLabel={cancel}
      />
    </form>
  );
}
