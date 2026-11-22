import { ProjectsManager } from "@/components/projects/projects-manager";
import { requireAppSession } from "@/lib/require-session";
import { getServices } from "@/services";

export default async function GroupProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ projectError?: string; categoryError?: string }>;
}) {
  const { locale } = await params;
  const { projectError, categoryError } = await searchParams;
  const session = await requireAppSession(locale);
  const { projects } = getServices();
  const isOperator = session.user.role === "operator";
  const groupProjects = await projects.listInGroup({ session });

  return (
    <ProjectsManager
      locale={locale}
      projects={groupProjects}
      isOperator={isOperator}
      error={projectError}
      categoryError={categoryError}
    />
  );
}
