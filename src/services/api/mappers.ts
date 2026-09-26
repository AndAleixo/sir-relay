import type {
  AccountStatus,
  Locale,
  Role,
  Session,
  Task,
  TaskDifficulty,
  TaskStatus,
  Teammate,
  User,
  UserGroup,
} from "@/domain/types";
import type {
  AccountStatus as DbAccountStatus,
  Locale as PrismaLocale,
  Role as DbRole,
  Task as DbTask,
  TaskDifficulty as DbTaskDifficulty,
  TaskStatus as DbTaskStatus,
  User as DbUser,
} from "@prisma/client";
import { toAppLocale, toDbLocale, type DbLocale } from "@/i18n/config";
import { needsLegalAccept } from "@/lib/legal";

export function toLocale(value: PrismaLocale): Locale {
  return toAppLocale(value as DbLocale);
}

export function fromLocale(value: Locale): PrismaLocale {
  return toDbLocale(value) as PrismaLocale;
}

export function toRole(value: DbRole): Role {
  return value;
}

export function toAccountStatus(value: DbAccountStatus): AccountStatus {
  return value;
}

export function toTaskStatus(value: DbTaskStatus): TaskStatus {
  return value;
}

export function toTaskDifficulty(
  value: DbTaskDifficulty | null,
): TaskDifficulty | null {
  return value;
}

export function telegramStatus(user: DbUser): "linked" | "pending" {
  return user.telegramChatId ? "linked" : "pending";
}

export function toUser(
  user: DbUser,
  role: Role = "operator",
  displayName: string | null = null,
): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    locale: toLocale(user.locale),
    active: user.active,
    mustChangePassword: user.mustChangePassword,
    termsVersion: user.termsVersion,
    needsLegalAccept: needsLegalAccept(user.termsVersion),
    telegramStatus: telegramStatus(user),
    displayName,
  };
}

export function toTeammate(
  user: DbUser,
  role: Role = "teammate",
  displayName: string | null = null,
): Teammate {
  return {
    ...toUser(user, role, displayName),
    role: "teammate",
    accountStatus: toAccountStatus(user.accountStatus),
    telegramStatus: telegramStatus(user),
  };
}

export function toTask(
  row: DbTask & {
    project?: { acronym: string } | null;
    category?: { name: string } | null;
  },
  assigneeName: string,
): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assigneeId: row.assigneeId,
    assigneeName,
    status: toTaskStatus(row.status),
    difficulty: toTaskDifficulty(row.difficulty),
    dueDate: row.dueDate ? row.dueDate.toISOString().slice(0, 10) : null,
    telegramNotifyFailed: row.telegramNotifyFailed,
    sortOrder: row.sortOrder,
    projectId: row.projectId,
    projectAcronym: row.project?.acronym ?? null,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function toUserGroup(
  group: { id: string; name: string; ownerUserId: string },
  role: Role,
): UserGroup {
  return {
    id: group.id,
    name: group.name,
    ownerUserId: group.ownerUserId,
    role,
  };
}

export type HydratedSession = Session;
