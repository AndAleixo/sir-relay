"use client";

import { useTranslations } from "next-intl";
import {
  acceptProjectForm,
  archiveProjectForm,
  createProjectForm,
  requestProjectForm,
} from "@/app/actions/settings";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { CheckIcon, TrashIcon } from "@/components/ui/icons";
import { Input, Label } from "@/components/ui/input";
import type { Project } from "@/domain/types";
import { cn } from "@/lib/cn";
import {
  isPendingProject,
  MAX_OPEN_PROJECTS,
  MAX_PENDING_PROJECTS,
  PROJECT_ACRONYM_MAX,
  PROJECT_NAME_MAX,
} from "@/lib/project";

const PROJECT_COLS =
  "grid grid-cols-[minmax(0,1fr)_5.5rem_auto] items-center gap-2";

const PROJECT_ERRORS = {
  acronym: "settings.projectErrorAcronym",
  name: "settings.projectErrorName",
  taken: "settings.projectErrorTaken",
  limit: "settings.projectErrorLimit",
  pendingLimit: "settings.projectErrorPendingLimit",
  failed: "settings.projectErrorFailed",
} as const;

type GroupProjectsSettingsProps = {
  locale: string;
  projects: Project[];
  isOperator: boolean;
  error?: string;
};

export function GroupProjectsSettings({
  locale,
  projects,
  isOperator,
  error,
}: GroupProjectsSettingsProps) {
  const t = useTranslations();
  const createAction = createProjectForm.bind(null, locale);
  const requestAction = requestProjectForm.bind(null, locale);
  const acceptAction = acceptProjectForm.bind(null, locale);
  const archiveAction = archiveProjectForm.bind(null, locale);
  const accepted = projects.filter((project) => !isPendingProject(project));
  const pendingCount = projects.length - accepted.length;
  const atOpenLimit = accepted.length >= MAX_OPEN_PROJECTS;
  const atPendingLimit = pendingCount >= MAX_PENDING_PROJECTS;
  const hideForm = isOperator ? atOpenLimit : atOpenLimit || atPendingLimit;
  const errorKey =
    error && error in PROJECT_ERRORS
      ? PROJECT_ERRORS[error as keyof typeof PROJECT_ERRORS]
      : null;
  const errorCount =
    error === "pendingLimit" ? MAX_PENDING_PROJECTS : MAX_OPEN_PROJECTS;

  return (
    <div className="space-y-3">
      {errorKey ? (
        <Banner variant="severity">{t(errorKey, { count: errorCount })}</Banner>
      ) : null}

      {hideForm ? (
        <p className="text-xs text-[var(--text-muted)]">
          {t(
            isOperator || atOpenLimit
              ? "settings.projectsLimit"
              : "settings.projectsPendingLimit",
            {
              count:
                isOperator || atOpenLimit
                  ? MAX_OPEN_PROJECTS
                  : MAX_PENDING_PROJECTS,
            },
          )}
        </p>
      ) : (
        <form
          action={isOperator ? createAction : requestAction}
          className={cn(PROJECT_COLS, "items-end")}
        >
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
              minLength={1}
              maxLength={PROJECT_ACRONYM_MAX}
              className="uppercase"
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="shrink-0 px-3">
            {t(isOperator ? "settings.addProject" : "settings.requestProject")}
          </Button>
        </form>
      )}

      <div className="border-t border-[var(--border)] pt-3">
        {projects.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">{t("settings.projectsEmpty")}</p>
        ) : (
          <ul className="max-h-[11.5rem] space-y-2 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [scrollbar-width:thin]">
            {projects.map((project) => {
              const pending = isPendingProject(project);
              return (
                <li
                  key={project.id}
                  className={
                    isOperator
                      ? PROJECT_COLS
                      : "grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-2"
                  }
                >
                  <p className="min-w-0 truncate text-sm font-medium text-[var(--text-primary)]">
                    {project.name}
                    {pending ? (
                      <span className="ml-1.5 text-xs font-normal text-[var(--text-muted)]">
                        {t("settings.projectPending")}
                      </span>
                    ) : null}
                  </p>
                  <span className="truncate text-sm font-medium tracking-wide text-[var(--text-muted)]">
                    {project.acronym}
                  </span>
                  {isOperator ? (
                    <div className="flex items-center justify-end gap-0.5">
                      {pending ? (
                        <form action={acceptAction}>
                          <input type="hidden" name="projectId" value={project.id} />
                          <button
                            type="submit"
                            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30"
                            aria-label={t("settings.acceptProject")}
                            title={t("settings.acceptProject")}
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      ) : null}
                      <form
                        action={archiveAction}
                        onSubmit={(event) => {
                          if (
                            !window.confirm(
                              t("settings.projectRemoveConfirm", {
                                name: project.name,
                              }),
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
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
