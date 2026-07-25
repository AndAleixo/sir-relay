"use client";

import type { Task, TaskStatus } from "@/domain/types";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

export type TaskFormAssigneeOption = {
  id: string;
  label: string;
};

export type TaskFormLabels = {
  title: string;
  titlePlaceholder: string;
  assignee: string;
  assigneeHint: string;
  dueDate: string;
  description: string;
  descriptionPlaceholder: string;
  status: string;
  overdue: string;
};

type TaskFormFieldsProps = {
  mode: "create" | "edit";
  labels: TaskFormLabels;
  isOperator: boolean;
  assigneeOptions: TaskFormAssigneeOption[];
  statusLabels?: Record<TaskStatus, string>;
  defaultValues?: Pick<Task, "title" | "description" | "dueDate" | "status" | "assigneeId">;
  overdue?: boolean;
};

export function TaskFormFields({
  mode,
  labels,
  isOperator,
  assigneeOptions,
  statusLabels,
  defaultValues,
  overdue = false,
}: TaskFormFieldsProps) {
  return (
    <>
      <div>
        <Label htmlFor="title">{labels.title}</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaultValues?.title}
          placeholder={labels.titlePlaceholder}
        />
      </div>

      {isOperator && (
        <div>
          <Label htmlFor="assigneeId">{labels.assignee}</Label>
          <Select
            id="assigneeId"
            name="assigneeId"
            required={mode === "create"}
            defaultValue={defaultValues?.assigneeId ?? assigneeOptions[0]?.id}
            options={assigneeOptions.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
            aria-label={labels.assignee}
          />
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            {labels.assigneeHint}
          </p>
        </div>
      )}

      {mode === "edit" && statusLabels && (
        <div>
          <Label htmlFor="status">{labels.status}</Label>
          <Select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? "todo"}
            options={(["todo", "doing", "done"] as const).map((status) => ({
              value: status,
              label: statusLabels[status],
            }))}
            aria-label={labels.status}
          />
        </div>
      )}

      <div>
        <Label htmlFor="dueDate">{labels.dueDate}</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={defaultValues?.dueDate ?? ""}
        />
        {mode === "edit" && overdue && defaultValues?.dueDate && (
          <p className="mt-1.5 text-xs font-medium text-[var(--danger)]">
            {labels.overdue}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">{labels.description}</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description}
          placeholder={labels.descriptionPlaceholder}
        />
      </div>
    </>
  );
}
