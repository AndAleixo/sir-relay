"use client";

import { useTranslations } from "next-intl";
import { archiveProjectForm, createProjectForm } from "@/app/actions/settings";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@/components/ui/icons";
import { Input, Label } from "@/components/ui/input";
import type { Project } from "@/domain/types";
import { cn } from "@/lib/cn";
import { MAX_OPEN_PROJECTS, PROJECT_NAME_MAX } from "@/lib/project";

const PROJECT_COLS =
  "grid grid-cols-[minmax(0,1fr)_5.5rem_auto] items-center gap-2";

const PROJECT_ERRORS = {
  acronym: "settings.projectErrorAcronym",
  name: "settings.projectErrorName",
  taken: "settings.projectErrorTaken",
  limit: "settings.projectErrorLimit",
  failed: "settings.projectErrorFailed",
} as const;

type GroupProjectsSettingsProps = {
  locale: string;
  projects: Project[];
  error?: string;
};

export function GroupProjectsSettings({
  locale,
  projects,
  error,
}: GroupProjectsSettingsProps) {
  const t = useTranslations();
  const createAction = createProjectForm.bind(null, locale);
  const archiveAction = archiveProjectForm.bind(null, locale);
  const atLimit = projects.length >= MAX_OPEN_PROJECTS;
  const errorKey =
    error && error in PROJECT_ERRORS
      ? PROJECT_ERRORS[error as keyof typeof PROJECT_ERRORS]
      : null;

  return (
    <div className="space-y-3">
      {errorKey ? (
        <Banner variant="severity">
          {t(errorKey, { count: MAX_OPEN_PROJECTS })}
        </Banner>
      ) : null}

      {atLimit ? (
        <p className="text-xs text-[var(--text-muted)]">
          {t("settings.projectsLimit", { count: MAX_OPEN_PROJECTS })}
        </p>
      ) : (
        <form action={createAction} className={cn(PROJECT_COLS, "items-end")}>
          <div className="min-w-0">
            <Label htmlFor="project-name">{t("settings.projectName")}</Label>
            <Input id="project-name" name="name" required maxLength={PROJECT_NAME_MAX} />
          </div>
          <div className="min-w-0">
            <Label htmlFor="project-acronym" className="truncate">
              {t("settings.projectAcronym")}
            </Label>
            <Input
              id="project-acronym"
              name="acronym"
              required
              minLength={2}
              maxLength={4}
              className="uppercase"
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="shrink-0 px-3">
            {t("settings.addProject")}
          </Button>
        </form>
      )}

      <div className="border-t border-[var(--border)] pt-3">
        {projects.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">{t("settings.projectsEmpty")}</p>
        ) : (
          <ul className="max-h-[11.5rem] space-y-2 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [scrollbar-width:thin]">
            {projects.map((project) => (
              <li key={project.id} className={PROJECT_COLS}>
                <p className="min-w-0 truncate text-sm font-medium text-[var(--text-primary)]">
                  {project.name}
                </p>
                <span className="truncate text-sm font-medium tracking-wide text-[var(--text-muted)]">
                  {project.acronym}
                </span>
                <form
                  action={archiveAction}
                  onSubmit={(event) => {
                    if (
                      !window.confirm(
                        t("settings.projectRemoveConfirm", { name: project.name }),
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="projectId" value={project.id} />
                  <button
                    type="submit"
                    className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--severity)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30"
                    aria-label={t("settings.removeProject")}
                    title={t("settings.removeProject")}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
