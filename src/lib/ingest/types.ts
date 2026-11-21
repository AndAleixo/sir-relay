import type { TaskDifficulty } from "@/domain/types";

/** Raw LLM output before id resolution. */
export type IngestTaskHint = {
  title: string;
  description?: string;
  assigneeHint?: string;
  dueDate?: string;
  difficulty?: TaskDifficulty;
  projectHint?: string;
  categoryHint?: string;
};

/** Pending create ready for UI / approve. */
export type PendingCreateDraft = {
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string | null;
  difficulty: TaskDifficulty | null;
  projectId: string | null;
  categoryId: string | null;
};

export type IngestMember = { id: string; label: string };
export type IngestCategory = { id: string; name: string };
export type IngestProject = {
  id: string;
  name: string;
  acronym: string;
  categories: IngestCategory[];
};

export type IngestContext = {
  members: IngestMember[];
  projects: IngestProject[];
  /** Default assignee when hint missing or invalid for role. */
  defaultAssigneeId: string;
  role: "operator" | "teammate";
};
