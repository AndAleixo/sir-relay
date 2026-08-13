"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type TaskFormActionsProps = {
  cancelHref: string;
  saveLabel: string;
  cancelLabel: string;
  deleteLabel?: string;
  deleteConfirm?: string;
  onDelete?: () => Promise<void>;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {label}
    </Button>
  );
}

export function TaskFormActions({
  cancelHref,
  saveLabel,
  cancelLabel,
  deleteLabel,
  deleteConfirm,
  onDelete,
}: TaskFormActionsProps) {
  const [isDeleting, startDelete] = useTransition();

  function handleDelete() {
    if (!onDelete || !deleteConfirm) return;
    if (!window.confirm(deleteConfirm)) return;
    startDelete(async () => {
      await onDelete();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <SubmitButton label={saveLabel} />
      <Link href={cancelHref}>
        <Button variant="secondary" type="button">
          {cancelLabel}
        </Button>
      </Link>
      {onDelete && deleteLabel && (
        <Button
          type="button"
          variant="severity"
          className="ml-auto"
          disabled={isDeleting}
          onClick={handleDelete}
        >
          {deleteLabel}
        </Button>
      )}
    </div>
  );
}
