/** "" = all tasks (option label "Project"), else open project id. */
export function taskMatchesProject(
  task: { projectId: string | null },
  projectFilter: string,
): boolean {
  if (!projectFilter) return true;
  return task.projectId === projectFilter;
}
