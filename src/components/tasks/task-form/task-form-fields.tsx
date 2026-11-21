"use client";

import type { Task, TaskStatus } from "@/domain/types";
import { TASK_DIFFICULTIES } from "@/lib/task-difficulty";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

export type TaskFormAssigneeOption = {
  id: string;
  label: string;
};

export type TaskFormFieldValues = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "dueDate"
    | "status"
    | "assigneeId"
    | "difficulty"
    | "projectId"
    | "categoryId"
  >
>;

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
  category?: string;
  categoryNone?: string;
};

type TaskFormFieldsProps = {
  mode: "create" | "edit";
  labels: TaskFormLabels;
  isOperator: boolean;
  assigneeOptions: TaskFormAssigneeOption[];
  projectOptions: { id: string; label: string }[];
  /** When set, show category select (options filtered by caller). */
  categoryOptions?: { id: string; label: string }[];
  statusLabels?: Record<TaskStatus, string>;
  defaultValues?: TaskFormFieldValues;
  /** Controlled mode for pending compose cards. */
  values?: TaskFormFieldValues;
  onChange?: (patch: TaskFormFieldValues) => void;
  /** Prefix for html ids when multiple forms on one page. */
  idPrefix?: string;
  overdue?: boolean;
};

export function TaskFormFields({
  mode,
  labels,
  isOperator,
  assigneeOptions,
  projectOptions,
  categoryOptions,
  statusLabels,
  defaultValues,
  values,
  onChange,
  idPrefix = "",
  overdue = false,
}: TaskFormFieldsProps) {
  const controlled = values !== undefined;
  const difficultyLabels = {
    easy: labels.difficultyEasy,
    medium: labels.difficultyMedium,
    hard: labels.difficultyHard,
  } as const;

  function fid(name: string) {
    return idPrefix ? `${idPrefix}-${name}` : name;
  }

  function fieldValue<K extends keyof TaskFormFieldValues>(
    key: K,
  ): TaskFormFieldValues[K] | undefined {
    if (controlled) return values?.[key];
    return defaultValues?.[key];
  }

  function setField<K extends keyof TaskFormFieldValues>(
    key: K,
    value: TaskFormFieldValues[K],
  ) {
    onChange?.({ [key]: value } as TaskFormFieldValues);
  }

  return (
    <>
      <div>
        <Label htmlFor={fid("title")}>{labels.title}</Label>
        <Input
          id={fid("title")}
          name="title"
          required
          maxLength={200}
          value={controlled ? (values?.title ?? "") : undefined}
          defaultValue={controlled ? undefined : defaultValues?.title}
          onChange={
            controlled
              ? (event) => setField("title", event.target.value)
              : undefined
          }
          placeholder={labels.titlePlaceholder}
        />
      </div>

      {isOperator && (
        <div>
          <Label htmlFor={fid("assigneeId")} className="mb-0">
            {labels.assignee}
          </Label>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {labels.assigneeHint}
          </p>
          <div className="mt-1.5">
            <Select
              id={fid("assigneeId")}
              name="assigneeId"
              required={mode === "create"}
              value={
                controlled
                  ? (values?.assigneeId ?? assigneeOptions[0]?.id ?? "")
                  : undefined
              }
              defaultValue={
                controlled
                  ? undefined
                  : (defaultValues?.assigneeId ?? assigneeOptions[0]?.id)
              }
              onChange={
                controlled
                  ? (next) => setField("assigneeId", next)
                  : undefined
              }
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
          <Label htmlFor={fid("status")}>{labels.status}</Label>
          <Select
            id={fid("status")}
            name="status"
            value={controlled ? (values?.status ?? "todo") : undefined}
            defaultValue={controlled ? undefined : (defaultValues?.status ?? "todo")}
            onChange={
              controlled ? (next) => setField("status", next as TaskStatus) : undefined
            }
            options={(["todo", "doing", "done"] as const).map((status) => ({
              value: status,
              label: statusLabels[status],
            }))}
            aria-label={labels.status}
          />
        </div>
      )}

      <div>
        <Label htmlFor={fid("difficulty")}>{labels.difficulty}</Label>
        <Select
          id={fid("difficulty")}
          name="difficulty"
          value={
            controlled ? (values?.difficulty ?? "") : undefined
          }
          defaultValue={controlled ? undefined : (defaultValues?.difficulty ?? "")}
          onChange={
            controlled
              ? (next) =>
                  setField(
                    "difficulty",
                    next === "" ? null : (next as Task["difficulty"]),
                  )
              : undefined
          }
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
          <Label htmlFor={fid("projectId")}>{labels.project}</Label>
          <Select
            id={fid("projectId")}
            name="projectId"
            value={controlled ? (values?.projectId ?? "") : undefined}
            defaultValue={controlled ? undefined : (defaultValues?.projectId ?? "")}
            onChange={
              controlled
                ? (next) => {
                    onChange?.({
                      projectId: next || null,
                      categoryId: null,
                    });
                  }
                : undefined
            }
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

      {categoryOptions && labels.category && labels.categoryNone ? (
        <div>
          <Label htmlFor={fid("categoryId")}>{labels.category}</Label>
          <Select
            id={fid("categoryId")}
            name="categoryId"
            value={controlled ? (values?.categoryId ?? "") : undefined}
            defaultValue={
              controlled ? undefined : (defaultValues?.categoryId ?? "")
            }
            onChange={
              controlled
                ? (next) => setField("categoryId", next || null)
                : undefined
            }
            disabled={!fieldValue("projectId")}
            options={[
              { value: "", label: labels.categoryNone },
              ...categoryOptions.map((option) => ({
                value: option.id,
                label: option.label,
              })),
            ]}
            aria-label={labels.category}
          />
        </div>
      ) : null}

      <div>
        <Label htmlFor={fid("dueDate")}>{labels.dueDate}</Label>
        <Input
          id={fid("dueDate")}
          name="dueDate"
          type="date"
          value={controlled ? (values?.dueDate ?? "") : undefined}
          defaultValue={controlled ? undefined : (defaultValues?.dueDate ?? "")}
          onChange={
            controlled
              ? (event) => setField("dueDate", event.target.value || null)
              : undefined
          }
        />
        {mode === "edit" && overdue && defaultValues?.dueDate && (
          <p className="mt-1.5 text-xs font-medium text-[var(--severity)]">
            {labels.overdue}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor={fid("description")}>{labels.description}</Label>
        <Textarea
          id={fid("description")}
          name="description"
          value={controlled ? (values?.description ?? "") : undefined}
          defaultValue={controlled ? undefined : defaultValues?.description}
          onChange={
            controlled
              ? (event) => setField("description", event.target.value)
              : undefined
          }
          placeholder={labels.descriptionPlaceholder}
        />
      </div>
    </>
  );
}
