export type Role = "operator" | "teammate";

export type TaskStatus = "todo" | "doing" | "done";

export type Locale = "en-gb" | "es-es" | "pt-br";

export type AccountStatus = "invited" | "active";

export type TelegramLinkStatus = "linked" | "pending";

export type GroupInvitationStatus = "pending" | "declined" | "expired";

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  invitedUserId: string;
  invitedUserName: string;
  invitedUserEmail: string;
  role: "teammate";
  status: GroupInvitationStatus;
  expiresAt: string;
}

export interface Group {
  id: string;
  name: string;
}

/** Group the user belongs to, with membership role (matches GET /groups). */
export type UserGroup = Group & { role: Role };

export interface GroupMembership {
  groupId: string;
  userId: string;
  role: Role;
  /** Optional per-group fantasy label; UI prefers this over account name. */
  displayName?: string | null;
}

/** Public invite metadata — no secrets. */
export interface GroupInvitePreview {
  groupId: string;
  groupName: string;
  email: string;
  role: Role;
  /** True when invitee must set a password (new / invited account). */
  needsPassword: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** Effective role in the active group (derived from membership when set). */
  role: Role;
  locale: Locale;
  active: boolean;
  mustChangePassword?: boolean;
  telegramStatus?: TelegramLinkStatus;
  /** Populated for group-scoped views from `group_memberships.display_name`. */
  displayName?: string | null;
}

export type OperatorAlertType = "task_done" | "task_due";

export interface OperatorAlert {
  id: string;
  type: OperatorAlertType;
  taskId: string;
  taskTitle: string;
  assigneeName: string;
  dueDate: string | null;
  createdAt: string;
  sentToTelegram: boolean;
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
  telegramNotifyFailed: boolean;
  /** Lower = higher priority in the assignee To do queue. */
  sortOrder: number;
  updatedAt: string;
  createdAt: string;
}

export interface Session {
  user: User;
  /** Selected group — required before app routes (tasks, teammates, …). */
  activeGroupId: string | null;
}
