import type {
  Comment,
  Locale,
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
  logout(): Promise<void>;
}

export interface TaskService {
  listTasks(ctx: { session: Session }): Promise<Task[]>;
  getTask(id: string, ctx: { session: Session }): Promise<Task | null>;
  listComments(taskId: string): Promise<Comment[]>;
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
}

export interface TeammateService {
  listTeammates(): Promise<Teammate[]>;
  listOrganizationUsers(): Promise<OrganizationUser[]>;
  getTeammate(id: string): Promise<Teammate | null>;
  createTeammate(input: CreateTeammateInput): Promise<Teammate>;
}

export interface UserService {
  updateLocale(userId: string, locale: Locale): Promise<User>;
}

export interface Services {
  auth: AuthService;
  tasks: TaskService;
  teammates: TeammateService;
  users: UserService;
  alerts: OperatorAlertService;
}
