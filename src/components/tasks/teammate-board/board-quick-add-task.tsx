"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { teamBoardStyles } from "./teammate-board.styles";

interface BoardQuickAddTaskProps {
  assigneeId: string;
  assigneeName: string;
  addLabel: string;
  titlePlaceholder: string;
  onCreate: (input: {
    title: string;
    assigneeId: string;
    assigneeName: string;
  }) => Promise<boolean>;
}

export function BoardQuickAddTask({
  assigneeId,
  assigneeName,
  addLabel,
  titlePlaceholder,
  onCreate,
}: BoardQuickAddTaskProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    const trimmed = title.trim();
    if (!trimmed || pending) {
      if (!trimmed) {
        setOpen(false);
        setTitle("");
      }
      return;
    }

    setPending(true);
    const ok = await onCreate({
      title: trimmed,
      assigneeId,
      assigneeName,
    });
    setPending(false);

    if (ok) {
      setTitle("");
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        data-no-drag-scroll
        className={teamBoardStyles.quickAdd}
        onClick={() => setOpen(true)}
      >
        + {addLabel}
      </button>
    );
  }

  return (
    <div data-no-drag-scroll className={teamBoardStyles.quickAddForm}>
      <Input
        autoFocus
        value={title}
        placeholder={titlePlaceholder}
        disabled={pending}
        className={teamBoardStyles.quickAddInput}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void submit();
          }
          if (event.key === "Escape") {
            setOpen(false);
            setTitle("");
          }
        }}
        onBlur={() => {
          void submit();
        }}
      />
    </div>
  );
}
