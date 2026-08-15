import { getTranslations } from "next-intl/server";
import { archiveProjectForm, createProjectForm } from "@/app/actions/settings";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Project } from "@/domain/types";

type GroupProjectsSettingsProps = {
  locale: string;
  projects: Project[];
  error?: string;
};

export async function GroupProjectsSettings({
  locale,
  projects,
  error,
}: GroupProjectsSettingsProps) {
  const t = await getTranslations();
  const createAction = createProjectForm.bind(null, locale);
  const archiveAction = archiveProjectForm.bind(null, locale);

  return (
    <div className="space-y-3">
      {error === "acronym" ? (
        <Banner variant="severity">{t("settings.projectErrorAcronym")}</Banner>
      ) : null}
      {error === "name" ? (
        <Banner variant="severity">{t("settings.projectErrorName")}</Banner>
      ) : null}
      {error === "taken" ? (
        <Banner variant="severity">{t("settings.projectErrorTaken")}</Banner>
      ) : null}
      {error === "failed" ? (
        <Banner variant="severity">{t("settings.projectErrorFailed")}</Banner>
      ) : null}

      <form
        action={createAction}
        className="space-y-2 sm:flex sm:items-end sm:gap-3 sm:space-y-0"
      >
        <div className="min-w-0 flex-1">
          <Label htmlFor="project-name">{t("settings.projectName")}</Label>
          <Input id="project-name" name="name" required maxLength={20} />
        </div>
        <div className="w-full shrink-0 sm:w-20">
          <Label htmlFor="project-acronym">{t("settings.projectAcronym")}</Label>
          <Input
            id="project-acronym"
            name="acronym"
            required
            minLength={2}
            maxLength={4}
            className="uppercase"
            autoComplete="off"
            aria-describedby="project-acronym-hint"
          />
        </div>
        <Button type="submit" className="w-full shrink-0 sm:w-auto">
          {t("settings.addProject")}
        </Button>
      </form>
      <p id="project-acronym-hint" className="text-xs text-[var(--text-muted)]">
        {t("settings.projectAcronymHint")}
      </p>

      <div className="space-y-2 border-t border-[var(--border)] pt-3">
        {projects.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">{t("settings.projectsEmpty")}</p>
        ) : (
          <ul className="max-h-[11.5rem] space-y-2 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [scrollbar-width:thin]">
            {projects.map((project) => (
              <li
                key={project.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
              >
                <p className="min-w-0 flex-1 text-sm font-medium text-[var(--text-primary)]">
                  <span className="text-xs font-normal text-[var(--text-muted)]">
                    {project.acronym}
                  </span>{" "}
                  {project.name}
                </p>
                <form action={archiveAction}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full shrink-0 sm:w-auto"
                  >
                    {t("settings.archiveProject")}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
