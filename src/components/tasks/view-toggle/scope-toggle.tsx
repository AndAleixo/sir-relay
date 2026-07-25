"use client";

import { cn } from "@/lib/cn";
import type { TasksScope } from "@/lib/tasks-url";
import { viewToggleStyles } from "./view-toggle.styles";

interface ScopeToggleProps {
  value: TasksScope;
  onChange: (scope: TasksScope) => void;
  mineLabel: string;
  teamLabel: string;
  ariaLabel: string;
}

export function ScopeToggle({
  value,
  onChange,
  mineLabel,
  teamLabel,
  ariaLabel,
}: ScopeToggleProps) {
  return (
    <div className={viewToggleStyles.root} role="tablist" aria-label={ariaLabel}>
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
