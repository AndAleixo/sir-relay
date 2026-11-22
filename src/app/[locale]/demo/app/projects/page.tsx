"use client";

import { useLocale } from "next-intl";
import { useDemoActions, useDemoWorkspace } from "@/components/demo/demo-provider";
import { ProjectsManager } from "@/components/projects/projects-manager";

export default function DemoProjectsPage() {
  const locale = useLocale();
  const workspace = useDemoWorkspace();
  const { projects } = useDemoActions();
  if (!workspace) return null;

  return (
    <ProjectsManager
      locale={locale}
      projects={workspace.projects.filter((project) => !project.archivedAt)}
      isOperator
      local={projects}
    />
  );
}
