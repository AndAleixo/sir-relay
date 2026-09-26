"use client";

import { useTranslations } from "next-intl";
import {
  acceptProjectForm,
  archiveCategoryForm,
  archiveProjectForm,
  createCategoryForm,
  createProjectForm,
  requestProjectForm,
} from "@/app/actions/projects";
import { ToneBadge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { TrashIcon } from "@/components/ui/icons";
import { Input, Label } from "@/components/ui/input";
import type { ManagedProject } from "@/domain/types";
import { cn } from "@/lib/cn";
import {
  formatTaskHeading,
  isPendingProject,
  MAX_CATEGORIES_PER_PROJECT,
  MAX_OPEN_PROJECTS,
  MAX_PENDING_PROJECTS,
  PROJECT_ACRONYM_MAX,
  PROJECT_NAME_MAX,
} from "@/lib/project";
import { projectsPageStyles as s } from "./projects-page.styles";

const PROJECT_ERRORS = {
  acronym: "errorAcronym",
  name: "errorName",
  taken: "errorTaken",
  limit: "errorLimit",
  pendingLimit: "errorPendingLimit",
  failed: "errorFailed",
} as const;

const CATEGORY_ERRORS = {
  name: "categoryErrorName",
  taken: "categoryErrorTaken",
  limit: "categoryErrorLimit",
  failed: "categoryErrorFailed",
} as const;

type ProjectsManagerProps = {
  locale: string;
  projects: ManagedProject[];
  isOperator: boolean;
  error?: string;
  categoryError?: string;
};

export function ProjectsManager({
  locale,
  projects,
  isOperator,
  error,
  categoryError,
}: ProjectsManagerProps) {
  const t = useTranslations("projects");
  const createAction = createProjectForm.bind(null, locale);
  const requestAction = requestProjectForm.bind(null, locale);
  const acceptAction = acceptProjectForm.bind(null, locale);
  const archiveAction = archiveProjectForm.bind(null, locale);
  const addCategoryAction = createCategoryForm.bind(null, locale);
  const removeCategoryAction = archiveCategoryForm.bind(null, locale);

  const pending = projects.filter(isPendingProject);
  const open = projects.filter((project) => !isPendingProject(project));
  const atOpenLimit = open.length >= MAX_OPEN_PROJECTS;
  const atPendingLimit = pending.length >= MAX_PENDING_PROJECTS;
  const hideForm = isOperator ? atOpenLimit : atOpenLimit || atPendingLimit;
  const errorKey =
    error && error in PROJECT_ERRORS
      ? PROJECT_ERRORS[error as keyof typeof PROJECT_ERRORS]
      : null;
  const errorCount =
    error === "pendingLimit" ? MAX_PENDING_PROJECTS : MAX_OPEN_PROJECTS;
  const categoryErrorKey =
    categoryError && categoryError in CATEGORY_ERRORS
      ? CATEGORY_ERRORS[categoryError as keyof typeof CATEGORY_ERRORS]
      : null;

  return (
    <div>
      {errorKey ? (
        <Banner variant="severity" className="mb-4">
          {t(errorKey, { count: errorCount })}
        </Banner>
      ) : null}
      {categoryErrorKey ? (
        <Banner variant="severity" className="mb-4">
          {t(categoryErrorKey, { count: MAX_CATEGORIES_PER_PROJECT })}
        </Banner>
      ) : null}

      <div className={s.toolbar}>
        <p className={s.hint}>
          {t(isOperator ? "hint" : "hintTeammate")}
        </p>
        {hideForm ? (
          <p className={s.hint}>
            {t(isOperator || atOpenLimit ? "limit" : "pendingLimit", {
              count:
                isOperator || atOpenLimit
                  ? MAX_OPEN_PROJECTS
                  : MAX_PENDING_PROJECTS,
            })}
          </p>
        ) : (
          <form
            action={isOperator ? createAction : requestAction}
            className={s.form}
          >
            <div className={s.formName}>
              <Label htmlFor="project-name">{t("name")}</Label>
              <Input
                id="project-name"
                name="name"
                required
                maxLength={PROJECT_NAME_MAX}
              />
            </div>
            <div className={s.formAcronym}>
              <Label htmlFor="project-acronym">{t("acronym")}</Label>
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
            <Button type="submit" className="shrink-0">
              {t(isOperator ? "add" : "request")}
            </Button>
          </form>
        )}
      </div>

      {pending.length > 0 ? (
        <section className={s.pending}>
          <h2 className="text-sm font-semibold">{t("pendingSection")}</h2>
          <ul className={s.pendingList}>
            {pending.map((project) => (
              <li key={project.id} className={s.pendingRow}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-snug">
                    {formatTaskHeading(project.name, project.acronym)}
                  </p>
                  <ToneBadge tone="warning">{t("pending")}</ToneBadge>
                </div>
                {isOperator ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <form action={acceptAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <Button type="submit" variant="secondary" className="px-2.5">
                        {t("accept")}
                      </Button>
                    </form>
                    <ArchiveForm
                      action={archiveAction}
                      name="projectId"
                      id={project.id}
                      confirm={t("removeConfirm", { name: project.name })}
                      label={t("remove")}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {open.length === 0 ? (
        <p className={s.empty}>{t("empty")}</p>
      ) : (
        <ul className={s.grid}>
          {open.map((project) => {
            const atCategoryLimit =
              project.categories.length >= MAX_CATEGORIES_PER_PROJECT;
            return (
              <li key={project.id}>
                <Card className="flex h-full flex-col overflow-hidden">
                  <div className="flex items-start gap-2 px-4 pb-3 pt-4">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium leading-snug">
                      {formatTaskHeading(project.name, project.acronym)}
                    </p>
                    {isOperator ? (
                      <ArchiveForm
                        action={archiveAction}
                        name="projectId"
                        id={project.id}
                        confirm={t("removeConfirm", { name: project.name })}
                        label={t("remove")}
                      />
                    ) : null}
                  </div>
                  <CardBody className="flex flex-1 flex-col gap-2.5 border-t border-[var(--border)]">
                    <div className={s.catsHead}>
                      <h3 className={s.catsLabel}>{t("categories")}</h3>
                      <span className="text-xs tabular-nums text-[var(--text-muted)]">
                        {project.categories.length}/{MAX_CATEGORIES_PER_PROJECT}
                      </span>
                    </div>
                    {project.categories.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)]">{t("categoriesEmpty")}</p>
                    ) : (
                      <ul className={s.chips}>
                        {project.categories.map((category) => (
                          <li key={category.id} className={s.chip}>
                            <span className={s.chipLabel}>{category.name}</span>
                            <ArchiveForm
                              action={removeCategoryAction}
                              name="categoryId"
                              id={category.id}
                              confirm={t("categoryRemoveConfirm", {
                                name: category.name,
                              })}
                              label={t("removeCategory")}
                              compact
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                    {atCategoryLimit ? (
                      <p className="mt-auto text-xs text-[var(--text-muted)]">
                        {t("categoriesLimit", { count: MAX_CATEGORIES_PER_PROJECT })}
                      </p>
                    ) : (
                      <form
                        action={addCategoryAction}
                        className="mt-auto flex items-center gap-2"
                      >
                        <input type="hidden" name="projectId" value={project.id} />
                        <Input
                          id={`category-name-${project.id}`}
                          name="name"
                          required
                          maxLength={PROJECT_NAME_MAX}
                          placeholder={t("categoryName")}
                          aria-label={t("categoryName")}
                          className="min-w-0 flex-1"
                        />
                        <Button type="submit" variant="secondary" className="shrink-0 px-3">
                          {t("addCategory")}
                        </Button>
                      </form>
                    )}
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ArchiveForm({
  action,
  name,
  id,
  confirm,
  label,
  compact,
}: {
  action: (formData: FormData) => void;
  name: string;
  id: string;
  confirm: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirm)) event.preventDefault();
      }}
    >
      <input type="hidden" name={name} value={id} />
      <button
        type="submit"
        className={cn(s.iconBtnDanger, compact && "p-0.5")}
        aria-label={label}
        title={label}
      >
        <TrashIcon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </button>
    </form>
  );
}
