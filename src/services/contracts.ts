import type {
  Comment,
  Locale,
  Session,
  Task,
  TaskStatus,
  Teammate,
  User,
} from "@/domain/types";

export interface AuthService {
  getSession(): Promise<Session | null>;
  login(email: string, password: string): Promise<Session>;
  logout(): Promise<void>;
}

export interface TaskService {
  listTasks(ctx: { session: Session }): Promise<Task[]>;
  getTask(id: string, ctx: { session: Session }): Promise<Task | null>;
  listComments(taskId: string): Promise<Comment[]>;
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
  getTeammate(id: string): Promise<Teammate | null>;
}

export interface UserService {
  updateLocale(userId: string, locale: Locale): Promise<User>;
}

export interface Services {
  auth: AuthService;
  tasks: TaskService;
  teammates: TeammateService;
  users: UserService;
}
