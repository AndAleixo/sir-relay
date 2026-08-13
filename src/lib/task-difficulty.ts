import type { TaskDifficulty } from "@/domain/types";

export type { TaskDifficulty };

export const TASK_DIFFICULTIES = ["easy", "medium", "hard"] as const satisfies readonly TaskDifficulty[];

export function parseTaskDifficulty(raw: unknown): TaskDifficulty | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  return value === "easy" || value === "medium" || value === "hard" ? value : null;
}
