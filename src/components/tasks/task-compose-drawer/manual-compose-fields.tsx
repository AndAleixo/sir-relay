"use client";

import { useEffect, useRef } from "react";
import type { Task } from "@/domain/types";
import { TASK_DIFFICULTIES } from "@/lib/task-difficulty";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import type {
  TaskFormAssigneeOption,
  TaskFormFieldValues,
  TaskFormLabels,
} from "@/components/tasks/task-form";
import { composeDrawerStyles as styles } from "./compose-drawer.styles";
import { fitTextareaHeight } from "./fit-textarea";

type ManualComposeFieldsProps = {
  labels: TaskFormLabels;
  isOperator: boolean;
  locked?: boolean;
  assigneeOptions: TaskFormAssigneeOption[];
  projectOptions: { id: string; label: string }[];
  categoryOptions: { id: string; label: string }[];
  values: Required<
    Pick<
      TaskFormFieldValues,
      | "title"
      | "description"
      | "assigneeId"
      | "dueDate"
      | "difficulty"
      | "projectId"
      | "categoryId"
    >
  >;
  onChange: (patch: TaskFormFieldValues) => void;
};

export function ManualComposeFields({
  labels,
  isOperator,
  locked = false,
  assigneeOptions,
  projectOptions,
  categoryOptions,
  values,
  onChange,
}: ManualComposeFieldsProps) {
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const difficultyLabels = {
    easy: labels.difficultyEasy,
    medium: labels.difficultyMedium,
    hard: labels.difficultyHard,
  } as const;
  const showCategory =
    Boolean(labels.category && labels.categoryNone) &&
    categoryOptions.length > 0;

  useEffect(() => {
    fitTextareaHeight(descriptionRef.current, 160);
  }, [values.description]);

  return (
    <div className={styles.manual}>
      <div data-tour="demo-compose-title">
        <Input
          id="manual-title"
          name="title"
          required
          maxLength={200}
          disabled={locked}
          value={values.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder={labels.title}
          aria-label={labels.title}
          className={styles.composerTitle}
        />
      </div>

      <div className={styles.metaGrid}>
        {isOperator ? (
          <div data-tour="demo-compose-assignee">
            <Select
              id="manual-assigneeId"
              name="assigneeId"
              required
              disabled={locked}
              value={values.assigneeId ?? assigneeOptions[0]?.id ?? ""}
              onChange={(next) => onChange({ assigneeId: next })}
              options={assigneeOptions.map((option) => ({
                value: option.id,
                label: option.label,
              }))}
              aria-label={labels.assignee}
            />
          </div>
        ) : null}

        <Select
          id="manual-difficulty"
          name="difficulty"
          disabled={locked}
          compactTrigger
          value={values.difficulty ?? ""}
          onChange={(next) =>
            onChange({
              difficulty: next === "" ? null : (next as Task["difficulty"]),
            })
          }
          options={[
            {
              value: "",
              label: labels.difficultyNone,
              compactLabel: labels.difficulty,
            },
            ...TASK_DIFFICULTIES.map((value) => ({
              value,
              label: difficultyLabels[value],
            })),
          ]}
          aria-label={labels.difficulty}
        />

        {projectOptions.length > 0 ? (
          <Select
            id="manual-projectId"
            name="projectId"
            disabled={locked}
            compactTrigger
            value={values.projectId ?? ""}
            onChange={(next) =>
              onChange({ projectId: next || null, categoryId: null })
            }
            options={[
              {
                value: "",
                label: labels.projectNone,
                compactLabel: labels.project,
              },
              ...projectOptions.map((option) => ({
                value: option.id,
                label: option.label,
              })),
            ]}
            aria-label={labels.project}
          />
        ) : (
          <input type="hidden" name="projectId" value="" />
        )}

        {showCategory ? (
          <Select
            id="manual-categoryId"
            name="categoryId"
            disabled={locked}
            compactTrigger
            value={values.categoryId ?? ""}
            onChange={(next) => onChange({ categoryId: next || null })}
            options={[
              {
                value: "",
                label: labels.categoryNone!,
                compactLabel: labels.category!,
              },
              ...categoryOptions.map((option) => ({
                value: option.id,
                label: option.label,
              })),
            ]}
            aria-label={labels.category}
          />
        ) : null}

        <div
          className={cn(
            styles.metaDueWrap,
            showCategory && styles.metaDueWide,
          )}
        >
          {!values.dueDate ? (
            <span className={styles.metaDueGhost} aria-hidden>
              {labels.dueDate}
            </span>
          ) : null}
          <Input
            id="manual-dueDate"
            name="dueDate"
            type="date"
            disabled={locked}
            value={values.dueDate ?? ""}
            onChange={(event) =>
              onChange({ dueDate: event.target.value || null })
            }
            aria-label={labels.dueDate}
            className={cn(
              styles.metaDue,
              !values.dueDate && styles.metaDueEmpty,
            )}
          />
        </div>
      </div>

      <textarea
        ref={descriptionRef}
        id="manual-description"
        name="description"
        rows={1}
        disabled={locked}
        value={values.description ?? ""}
        onChange={(event) => onChange({ description: event.target.value })}
        placeholder={labels.description}
        aria-label={labels.description}
        className={styles.composerDescription}
      />
    </div>
  );
}
