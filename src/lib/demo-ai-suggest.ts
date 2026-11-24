/**
 * Demo-only Ask AI: split a short note into up to 5 draft titles (no OpenAI).
 */
import { AI_SUGGEST_TASKS_MAX, AI_SUGGEST_TEXT_MAX } from "@/lib/ai-suggest-quota";
import type { PendingCreateDraft } from "@/lib/ingest";

export const DEMO_AI_MONTHLY_LIMIT = 5;

export function demoSuggestDrafts(
  text: string,
  selfId: string,
  projectId: string | null,
):
  | { ok: true; drafts: PendingCreateDraft[] }
  | { ok: false; error: "too_long" | "suggest" } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "suggest" };
  if (trimmed.length > AI_SUGGEST_TEXT_MAX) return { ok: false, error: "too_long" };

  const parts = trimmed
    .split(/[\n.;]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, AI_SUGGEST_TASKS_MAX);

  const titles = parts.length > 0 ? parts : [trimmed.slice(0, 200)];
  return {
    ok: true,
    drafts: titles.map((title) => ({
      title: title.slice(0, 200),
      description: "",
      assigneeId: selfId,
      dueDate: null,
      difficulty: null,
      projectId,
      categoryId: null,
    })),
  };
}
