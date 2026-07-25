import type { SirRelayExport } from "@/domain/export";
import type {
  Group,
  GroupInvitation,
  GroupInvitePreview,
  Locale,
  Role,
  Session,
  Task,
  TaskStatus,
  Teammate,
  User,
  UserGroup,
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
  email: string;
}

export type CreateTeammateResult =
  | { ok: true; kind: "membership"; teammate: Teammate }
  | { ok: true; kind: "invitation"; invitation: GroupInvitation }
  | { ok: false; reason: "already_in_group" | "account_inactive" };

export interface AuthService {
  getSession(): Promise<Session | null>;
  login(email: string, password: string): Promise<Session>;
  signup(name: string, email: string, password: string, locale?: Locale): Promise<Session>;
  logout(): Promise<void>;
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<User>;
  joinWithToken(
    token: string,
    password: string,
    locale?: Locale,
    name?: string,
  ): Promise<Session>;
  setActiveGroup(userId: string, groupId: string | null): Promise<Session>;
  refreshSessionUser(user: User): Promise<void>;
  isInviteTokenValid(token: string): Promise<boolean>;
}

export interface GroupService {
  listForUser(userId: string): Promise<UserGroup[]>;
  create(userId: string, name: string): Promise<Group>;
  roleInGroup(userId: string, groupId: string): Promise<Role | null>;
  isMember(userId: string, groupId: string): Promise<boolean>;
  previewInvite(token: string): Promise<GroupInvitePreview | null>;
  acceptInvite(userId: string, token: string): Promise<Group>;
  pickResumeGroupId(userId: string): Promise<string | null>;
  renameGroup(userId: string, groupId: string, name: string): Promise<Group>;
  countMembers(groupId: string): Promise<number>;
  leaveGroup(userId: string, groupId: string): Promise<void>;
  deleteGroup(userId: string, groupId: string): Promise<void>;
  /** Transfer invisible ownership; only current owner. Promotes teammate target to operator. */
  transferOwnership(
    userId: string,
    groupId: string,
    newOwnerUserId: string,
  ): Promise<void>;
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
  /**
   * Clone task: same title/description/due/assignee/status, inserted
   * immediately below the source in that assignee+status queue.
   */
  cloneTask(sourceId: string, ctx: { session: Session }): Promise<Task[]>;
  /**
   * Place task in an assignee's To do queue at the given order (ids top → bottom).
   * May reassign + set status todo. Operator: any member; teammate: own queue only.
   */
  placeInTodoQueue(
    taskId: string,
    assigneeId: string,
    orderedTodoIds: string[],
    ctx: { session: Session },
  ): Promise<Task[]>;
}

export interface TeammateService {
  listTeammates(ctx: { session: Session }): Promise<Teammate[]>;
  listOrganizationUsers(ctx: { session: Session }): Promise<OrganizationUser[]>;
  getTeammate(id: string, ctx: { session: Session }): Promise<Teammate | null>;
  /** Any member in the active group (teammate or operator). */
  getOrganizationUser(
    id: string,
    ctx: { session: Session },
  ): Promise<OrganizationUser | null>;
  createTeammate(
    input: CreateTeammateInput,
    ctx: { session: Session },
  ): Promise<CreateTeammateResult>;
  updateTeammate(
    id: string,
    input: { displayName?: string | null; email?: string },
    ctx: { session: Session },
  ): Promise<OrganizationUser>;
  /** Operator or self: set/clear fantasy name on active-group membership. */
  updateMembershipDisplayName(
    userId: string,
    displayName: string | null,
    ctx: { session: Session },
  ): Promise<void>;
  removeTeammate(id: string, ctx: { session: Session }): Promise<void>;
  promoteToOperator(id: string, ctx: { session: Session }): Promise<void>;
  /** Operator → teammate. Blocked for group owner and last operator. */
  demoteToTeammate(id: string, ctx: { session: Session }): Promise<void>;
  regenerateInvite(id: string, ctx: { session: Session }): Promise<void>;
  getInviteToken(id: string, ctx: { session: Session }): Promise<string | null>;
}

export interface GroupInvitationService {
  listForUser(userId: string): Promise<GroupInvitation[]>;
  listForGroup(ctx: { session: Session }): Promise<GroupInvitation[]>;
  accept(invitationId: string, userId: string): Promise<Group>;
  decline(invitationId: string, userId: string): Promise<void>;
  resend(invitationId: string, ctx: { session: Session }): Promise<GroupInvitation>;
}

export interface ExportService {
  buildExport(ctx: { session: Session }, userId?: string): Promise<SirRelayExport>;
  filename(userId?: string): string;
}

export interface UserService {
  updateLocale(
    userId: string,
    locale: Locale,
    ctx: { session: Session },
  ): Promise<User>;
  updateName(userId: string, name: string, ctx: { session: Session }): Promise<User>;
  regenerateTelegramLink(
    userId: string,
    ctx: { session: Session },
  ): Promise<string>;
  getTelegramLinkToken(
    userId: string,
    ctx: { session: Session },
  ): Promise<string | null>;
}

export interface Services {
  auth: AuthService;
  groups: GroupService;
  tasks: TaskService;
  teammates: TeammateService;
  invitations: GroupInvitationService;
  users: UserService;
  alerts: OperatorAlertService;
  export: ExportService;
}
