"use client";

import { cn } from "@/lib/cn";
import { viewToggleStyles } from "./view-toggle.styles";

export type TasksScope = "mine" | "team";

interface ScopeToggleProps {
  value: TasksScope;
  onChange: (scope: TasksScope) => void;
  mineLabel: string;
  teamLabel: string;
}

export function ScopeToggle({
  value,
  onChange,
  mineLabel,
  teamLabel,
}: ScopeToggleProps) {
  return (
    <div className={viewToggleStyles.root} role="tablist" aria-label="Task scope">
      {(
        [
          { id: "mine", label: mineLabel },
          { id: "team", label: teamLabel },
        ] as const
      ).map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          className={cn(
            viewToggleStyles.button,
            value === option.id && viewToggleStyles.buttonActive,
          )}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
