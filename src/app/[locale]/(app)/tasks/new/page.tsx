import { redirect } from "next/navigation";
import { getServices } from "@/services";
import { requireAppSession } from "@/lib/require-session";
import {
  parseTasksProject,
  parseTasksScope,
  parseTasksView,
  taskNewHref,
} from "@/lib/tasks-url";

/** Legacy `/tasks/new` → board/list with compose drawer. */
export default async function NewTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    scope?: string;
    view?: string;
    project?: string;
    error?: string;
  }>;
}) {
  const { locale } = await params;
  const { scope: scopeRaw, view: viewRaw, project: projectRaw, error } =
    await searchParams;
  const session = await requireAppSession(locale);
  const { projects } = getServices();
  const openProjects = await projects.listOpen({ session });

  redirect(
    taskNewHref(locale, {
      scope: parseTasksScope(scopeRaw, session.user.role),
      view: parseTasksView(viewRaw),
      project: parseTasksProject(
        projectRaw,
        openProjects.map((row) => row.id),
      ),
      error,
    }),
  );
}
