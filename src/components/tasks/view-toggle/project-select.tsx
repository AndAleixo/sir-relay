"use client";

import { useMemo } from "react";
import type { ManagedProject } from "@/domain/types";
import { ButtonLink, buttonCompact } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { cn } from "@/lib/cn";
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
      <ButtonLink
        href={addProjectHref}
        variant="secondary"
        className={cn(viewToggleStyles.projectAdd, buttonCompact)}
      >
        {addProjectLabel}
      </ButtonLink>
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
