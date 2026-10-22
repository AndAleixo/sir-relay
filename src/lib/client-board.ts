import type { Session, Task, TaskStatus } from "@/domain/types";
import { groupMemberLabel } from "@/lib/group-member-label";
import { parseTaskDifficulty } from "@/lib/task-difficulty";
import { getServices } from "@/services";
import type { CreateTaskInput } from "@/services/contracts";

export type ClientBoard = {
  userId: string;
  role: Session["user"]["role"];
  groups: { id: string; name: string }[];
  groupId: string | null;
  groupName: string;
  projects: { id: string; acronym: string; name: string }[];
  members: { id: string; label: string }[];
  tasks: {
    id: string;
    title: string;
    projectId: string | null;
    acronym: string;
    description: string;
    due: string | null;
    difficulty: string;
    status: TaskStatus;
    order: number;
  }[];
};

function mine(task: Task, userId: string) {
  return task.assigneeId === userId;
}

export async function buildClientBoard(session: Session): Promise<ClientBoard> {
  const services = getServices();
  const groupList = await services.groups.listForUser(session.user.id);
  const group = groupList.find((row) => row.id === session.activeGroupId) ?? null;
  const groups = groupList.map((row) => ({ id: row.id, name: row.name }));
  if (!group) {
    return {
      userId: session.user.id,
      role: session.user.role,
      groups,
      groupId: null,
      groupName: "",
      projects: [],
      members: [],
      tasks: [],
    };
  }

  const openProjects = await services.projects.listOpen({ session });
  const orgUsers =
    session.user.role === "operator"
      ? await services.teammates.listOrganizationUsers({ session })
      : [];
  const me = orgUsers.find((user) => user.id === session.user.id);
  const selfLabel = `Me (${groupMemberLabel({
    name: session.user.name,
    email: session.user.email,
    displayName: me?.displayName,
  })})`;
  const members =
    session.user.role === "operator"
      ? [
          { id: session.user.id, label: selfLabel },
          ...orgUsers
            .filter((user) => user.id !== session.user.id)
            .map((user) => ({ id: user.id, label: groupMemberLabel(user) })),
        ]
      : [{ id: session.user.id, label: selfLabel }];

  const tasks = (await services.tasks.listTasks({ session }))
    .filter((task) => mine(task, session.user.id))
    .map((task) => ({
      id: task.id,
      title: task.title,
      projectId: task.projectId ?? null,
      acronym: task.projectAcronym ?? "",
      description: task.description,
      due: task.dueDate,
      difficulty: task.difficulty ?? "",
      status: task.status,
      order: task.sortOrder,
    }));

  return {
    userId: session.user.id,
    role: session.user.role,
    groups,
    groupId: group.id,
    groupName: group.name,
    projects: openProjects.map((row) => ({
      id: row.id,
      acronym: row.acronym,
      name: row.name,
    })),
    members,
    tasks,
  };
}

export function createInputFromBody(
  body: Record<string, unknown>,
  selfId: string,
): CreateTaskInput {
  const assigneeId = String(body.assigneeId ?? selfId).trim() || selfId;
  return {
    title: String(body.title ?? "").trim(),
    description: String(body.description ?? ""),
    assigneeId,
    dueDate: String(body.dueDate ?? "").trim() || null,
    difficulty: parseTaskDifficulty(body.difficulty),
    projectId: String(body.projectId ?? "").trim() || null,
  };
}
