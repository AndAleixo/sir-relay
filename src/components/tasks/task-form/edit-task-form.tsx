"use client";

import { deleteTaskAction, saveTaskDetailAction } from "@/app/actions/tasks";
import {
  TaskFormActions,
  TaskFormFields,
  type TaskFormAssigneeOption,
  type TaskFormLabels,
} from "@/components/tasks/task-form";
import type { Task, TaskStatus } from "@/domain/types";

type EditTaskFormProps = {
  task: Task;
  locale: string;
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
  isOperator,
  assigneeOptions,
  overdue,
  statusLabels,
  labels,
}: EditTaskFormProps) {
  const saveAction = saveTaskDetailAction.bind(null, locale, task.id);
  const { save, cancel, delete: deleteLabel, deleteConfirm, ...fieldLabels } = labels;

  return (
    <form action={saveAction} className="space-y-4">
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
        locale={locale}
        saveLabel={save}
        cancelLabel={cancel}
        deleteLabel={deleteLabel}
        deleteConfirm={deleteConfirm}
        onDelete={() => deleteTaskAction(locale, task.id)}
      />
    </form>
  );
}
