export type Role = "operator" | "teammate";

export type TaskStatus = "todo" | "doing" | "done";

export type Locale = "en" | "es" | "pt";

export type AccountStatus = "invited" | "active";

export type TelegramLinkStatus = "linked" | "pending";

export type CommentSource = "web" | "telegram";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  locale: Locale;
  active: boolean;
}

export interface Teammate extends User {
  role: "teammate";
  accountStatus: AccountStatus;
  telegramStatus: TelegramLinkStatus;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  status: TaskStatus;
  dueDate: string | null;
  archived: boolean;
  telegramNotifyFailed: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  body: string;
  source: CommentSource;
  authorName: string;
  createdAt: string;
}

export interface Session {
  user: User;
}

export interface ServiceContext {
  session: Session;
}
