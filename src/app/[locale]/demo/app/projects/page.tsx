"use client";

import { useLocale, useTranslations } from "next-intl";
import { useDemoActions, useDemoWorkspace } from "@/components/demo/demo-provider";
import { PageHeader } from "@/components/layout/app-shell";
import { ProjectsManager } from "@/components/projects/projects-manager";

export default function DemoProjectsPage() {
  const locale = useLocale();
  const t = useTranslations();
  const workspace = useDemoWorkspace();
  const { projects } = useDemoActions();
  if (!workspace) return null;

  return (
    <>
      <PageHeader title={t("common.projects")} />
      <ProjectsManager
        locale={locale}
        projects={workspace.projects.filter((project) => !project.archivedAt)}
        isOperator
        local={projects}
      />
    </>
  );
}
