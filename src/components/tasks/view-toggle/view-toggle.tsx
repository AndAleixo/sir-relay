"use client";

import { cn } from "@/lib/cn";
import type { TasksView } from "@/lib/tasks-url";
import { viewToggleStyles } from "./view-toggle.styles";

interface ViewToggleProps {
  value: TasksView;
  onChange: (view: TasksView) => void;
  boardLabel: string;
  listLabel: string;
}

export function ViewToggle({
  value,
  onChange,
  boardLabel,
  listLabel,
}: ViewToggleProps) {
  return (
    <div className={viewToggleStyles.root} role="tablist">
      {(["board", "list"] as const).map((view) => (
        <button
          key={view}
          type="button"
          role="tab"
          aria-selected={value === view}
          className={cn(
            viewToggleStyles.button,
            value === view && viewToggleStyles.buttonActive,
          )}
          onClick={() => onChange(view)}
        >
          {view === "board" ? boardLabel : listLabel}
        </button>
      ))}
    </div>
  );
}
