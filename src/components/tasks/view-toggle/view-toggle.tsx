"use client";

import { cn } from "@/lib/cn";
import { viewToggleStyles } from "./view-toggle.styles";

export type TasksView = "board" | "list";

interface ViewToggleProps {
  value: TasksView;
  onChange: (view: TasksView) => void;
  boardLabel: string;
  listLabel: string;
  hint?: string;
}

export function ViewToggle({
  value,
  onChange,
  boardLabel,
  listLabel,
  hint,
}: ViewToggleProps) {
  return (
    <div className={viewToggleStyles.toolbar}>
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
      {hint ? <p className={viewToggleStyles.hint}>{hint}</p> : null}
    </div>
  );
}
