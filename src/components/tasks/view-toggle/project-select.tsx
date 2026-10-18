"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ManagedProject } from "@/domain/types";
import { Select } from "@/components/ui/input";
import { viewToggleStyles } from "./view-toggle.styles";

type ProjectSelectProps = {
  projects: ManagedProject[];
  value: string | null;
  onChange: (projectId: string | null) => void;
  allLabel: string;
  projectLabel: string;
  addProjectHref?: string;
  addProjectLabel?: string;
};

export function ProjectSelect({
  projects,
  value,
  onChange,
  allLabel,
  projectLabel,
  addProjectHref,
  addProjectLabel,
}: ProjectSelectProps) {
  const options = useMemo(
    () => [
      { value: "", label: allLabel, compactLabel: projectLabel },
      ...projects.map((row) => ({
        value: row.id,
        label: row.acronym,
      })),
    ],
    [projects, allLabel, projectLabel],
  );

  if (projects.length === 0) {
    if (!addProjectHref || !addProjectLabel) return null;
    return (
      <p className={viewToggleStyles.projectAdd}>
        <Link
          href={addProjectHref}
          className="underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
        >
          {addProjectLabel}
        </Link>
      </p>
    );
  }

  return (
    <Select
      className={viewToggleStyles.projectSelect}
      triggerClassName={viewToggleStyles.projectTrigger}
      value={value ?? ""}
      onChange={(next) => onChange(next || null)}
      options={options}
      aria-label={projectLabel}
      compactTrigger
    />
  );
}
