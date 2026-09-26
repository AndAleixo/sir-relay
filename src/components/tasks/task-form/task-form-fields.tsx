"use client";

import type { Task, TaskStatus } from "@/domain/types";
import { TASK_DIFFICULTIES } from "@/lib/task-difficulty";
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
  difficulty: string;
  difficultyNone: string;
  difficultyEasy: string;
  difficultyMedium: string;
  difficultyHard: string;
  project: string;
  projectNone: string;
};

type TaskFormFieldsProps = {
  mode: "create" | "edit";
  labels: TaskFormLabels;
  isOperator: boolean;
  assigneeOptions: TaskFormAssigneeOption[];
  projectOptions: { id: string; label: string }[];
  statusLabels?: Record<TaskStatus, string>;
  defaultValues?: Partial<
    Pick<
      Task,
      | "title"
      | "description"
      | "dueDate"
      | "status"
      | "assigneeId"
      | "difficulty"
      | "projectId"
    >
  >;
  overdue?: boolean;
};

export function TaskFormFields({
  mode,
  labels,
  isOperator,
  assigneeOptions,
  projectOptions,
  statusLabels,
  defaultValues,
  overdue = false,
}: TaskFormFieldsProps) {
  const difficultyLabels = {
    easy: labels.difficultyEasy,
    medium: labels.difficultyMedium,
    hard: labels.difficultyHard,
  } as const;

  return (
    <>
      <div>
        <Label htmlFor="title">{labels.title}</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={defaultValues?.title}
          placeholder={labels.titlePlaceholder}
        />
      </div>

      {isOperator && (
        <div>
          <Label htmlFor="assigneeId" className="mb-0">
            {labels.assignee}
          </Label>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {labels.assigneeHint}
          </p>
          <div className="mt-1.5">
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
          </div>
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
        <Label htmlFor="difficulty">{labels.difficulty}</Label>
        <Select
          id="difficulty"
          name="difficulty"
          defaultValue={defaultValues?.difficulty ?? ""}
          options={[
            { value: "", label: labels.difficultyNone },
            ...TASK_DIFFICULTIES.map((value) => ({
              value,
              label: difficultyLabels[value],
            })),
          ]}
          aria-label={labels.difficulty}
        />
      </div>

      {projectOptions.length > 0 ? (
        <div>
          <Label htmlFor="projectId">{labels.project}</Label>
          <Select
            id="projectId"
            name="projectId"
            defaultValue={defaultValues?.projectId ?? ""}
            options={[
              { value: "", label: labels.projectNone },
              ...projectOptions.map((option) => ({
                value: option.id,
                label: option.label,
              })),
            ]}
            aria-label={labels.project}
          />
        </div>
      ) : (
        <input type="hidden" name="projectId" value="" />
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
          <p className="mt-1.5 text-xs font-medium text-[var(--severity)]">
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
