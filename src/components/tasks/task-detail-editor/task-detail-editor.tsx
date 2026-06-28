"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useFormStatus } from "react-dom";
import { deleteTaskAction, saveTaskDetailAction } from "@/app/actions/mock-tasks";
import type { Task, TaskStatus } from "@/domain/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

type AssigneeOption = {
  id: string;
  name: string;
  label: string;
};

type TaskDetailEditorProps = {
  task: Task;
  locale: string;
  isOperator: boolean;
  assigneeOptions: AssigneeOption[];
  overdue: boolean;
  statusLabels: Record<TaskStatus, string>;
  labels: {
    title: string;
    titlePlaceholder: string;
    assignee: string;
    assigneeHint: string;
    dueDate: string;
    description: string;
    descriptionPlaceholder: string;
    status: string;
    save: string;
    cancel: string;
    overdue: string;
    delete: string;
    deleteConfirm: string;
  };
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {label}
    </Button>
  );
}

export function TaskDetailEditor({
  task,
  locale,
  isOperator,
  assigneeOptions,
  overdue,
  statusLabels,
  labels,
}: TaskDetailEditorProps) {
  const saveAction = saveTaskDetailAction.bind(null, locale, task.id);
  const [isDeleting, startDelete] = useTransition();

  function handleDelete() {
    if (!window.confirm(labels.deleteConfirm)) return;
    startDelete(async () => {
      await deleteTaskAction(locale, task.id);
    });
  }

  return (
    <form action={saveAction} className="space-y-4">
      <div>
        <Label htmlFor="title">{labels.title}</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={task.title}
          placeholder={labels.titlePlaceholder}
        />
      </div>

      <div>
        <Label htmlFor="status">{labels.status}</Label>
        <Select id="status" name="status" defaultValue={task.status}>
          {(["todo", "doing", "done"] as const).map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </Select>
      </div>

      {isOperator && (
        <div>
          <Label htmlFor="assigneeId">{labels.assignee}</Label>
          <Select
            id="assigneeId"
            name="assigneeId"
            defaultValue={task.assigneeId}
          >
            {assigneeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            {labels.assigneeHint}
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="dueDate">{labels.dueDate}</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={task.dueDate ?? ""}
        />
        {overdue && task.dueDate && (
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
          defaultValue={task.description}
          placeholder={labels.descriptionPlaceholder}
          rows={6}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <SubmitButton label={labels.save} />
        <Link href={`/${locale}/tasks`}>
          <Button variant="secondary" type="button">
            {labels.cancel}
          </Button>
        </Link>
        <Button
          type="button"
          variant="danger"
          className="ml-auto"
          disabled={isDeleting}
          onClick={handleDelete}
        >
          {labels.delete}
        </Button>
      </div>
    </form>
  );
}
