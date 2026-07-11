import type {
  Group,
  Locale,
  Role,
  Session,
  Task,
  TaskStatus,
  Teammate,
  User,
} from "@/domain/types";
import type { OperatorAlertService } from "@/services/alert.types";

export type OrganizationUser =
  | (User & { role: "operator" })
  | Teammate;

export interface CreateTaskInput {
  title: string;
  description?: string;
  assigneeId: string;
  dueDate?: string | null;
}

export interface CreateTeammateInput {
  name: string;
  email: string;
  locale: Locale;
}

export interface AuthService {
  getSession(): Promise<Session | null>;
  login(email: string, password: string): Promise<Session>;
  signup(name: string, email: string, password: string): Promise<Session>;
  logout(): Promise<void>;
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<User>;
  joinWithToken(token: string, password: string): Promise<Session>;
  setActiveGroup(userId: string, groupId: string | null): Promise<Session>;
  refreshSessionUser(user: User): Promise<void>;
  isInviteTokenValid(token: string): Promise<boolean>;
}

export interface GroupService {
  listForUser(userId: string): Promise<Group[]>;
  create(userId: string, name: string): Promise<Group>;
  roleInGroup(userId: string, groupId: string): Promise<Role | null>;
  isMember(userId: string, groupId: string): Promise<boolean>;
}

export interface TaskService {
  listTasks(ctx: { session: Session }): Promise<Task[]>;
  getTask(id: string, ctx: { session: Session }): Promise<Task | null>;
  createTask(input: CreateTaskInput, ctx: { session: Session }): Promise<Task>;
  updateTaskStatus(
    id: string,
    status: TaskStatus,
    ctx: { session: Session },
  ): Promise<Task>;
  reassignTask(
    id: string,
    assigneeId: string,
    assigneeName: string,
    ctx: { session: Session },
  ): Promise<Task>;
  updateTaskFields(
    id: string,
    fields: { title?: string; dueDate?: string | null; description?: string },
    ctx: { session: Session },
  ): Promise<Task>;
  deleteTask(id: string, ctx: { session: Session }): Promise<void>;
  renotifyTask(id: string, ctx: { session: Session }): Promise<Task>;
}

export interface TeammateService {
  listTeammates(ctx: { session: Session }): Promise<Teammate[]>;
  listOrganizationUsers(ctx: { session: Session }): Promise<OrganizationUser[]>;
  getTeammate(id: string): Promise<Teammate | null>;
  createTeammate(
    input: CreateTeammateInput,
    ctx: { session: Session },
  ): Promise<Teammate>;
  updateTeammate(
    id: string,
    input: { name?: string; email?: string },
  ): Promise<Teammate>;
  deactivateTeammate(id: string): Promise<Teammate>;
  regenerateInvite(id: string): Promise<string>;
  regenerateTelegramLink(id: string): Promise<string>;
  getInviteToken(id: string): Promise<string | null>;
  getTelegramLinkToken(id: string): Promise<string | null>;
}

export interface UserService {
  updateLocale(userId: string, locale: Locale): Promise<User>;
  regenerateTelegramLink(userId: string): Promise<string>;
  getTelegramLinkToken(userId: string): Promise<string | null>;
}

export interface Services {
  auth: AuthService;
  groups: GroupService;
  tasks: TaskService;
  teammates: TeammateService;
  users: UserService;
  alerts: OperatorAlertService;
}
