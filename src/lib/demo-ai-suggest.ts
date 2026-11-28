/**
 * Demo-only Ask AI: planning-style notes → concrete drafts (no OpenAI).
 */
import { AI_SUGGEST_TASKS_MAX, AI_SUGGEST_TEXT_MAX } from "@/lib/ai-suggest-quota";
import type { PendingCreateDraft } from "@/lib/ingest";

/** One Ask AI call on /demo (IP-enforced when OpenAI is configured). */
export const DEMO_AI_LIMIT = 1;

function dueInDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function makeDraft(
  title: string,
  description: string,
  dueOffset: number,
  selfId: string,
  projectId: string | null,
): PendingCreateDraft {
  return {
    title: title.slice(0, 200),
    description: description.slice(0, 500),
    assigneeId: selfId,
    dueDate: dueInDays(dueOffset),
    difficulty: null,
    projectId,
    categoryId: null,
  };
}

function splitExplicitList(text: string): string[] {
  return text
    .split(/[\n.;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function looksLikePlanning(text: string): boolean {
  return /\b(prepare|plan|set up|organize|weekly|monthly|stock\s*count|inventory|launch|onboard)\b/i.test(
    text,
  );
}

function stockCountDrafts(
  selfId: string,
  projectId: string | null,
): PendingCreateDraft[] {
  return [
    makeDraft(
      "Print or open the stock count sheet",
      "List SKUs you track each week.",
      0,
      selfId,
      projectId,
    ),
    makeDraft(
      "Count shelves and back stock",
      "Record quantities and note variances.",
      1,
      selfId,
      projectId,
    ),
    makeDraft(
      "Reconcile counts with records",
      "Adjust system quantities before ordering.",
      2,
      selfId,
      projectId,
    ),
    makeDraft(
      "Flag low stock and reorder",
      "Queue supplier orders for items below minimum.",
      3,
      selfId,
      projectId,
    ),
  ];
}

function genericPlanDrafts(
  text: string,
  selfId: string,
  projectId: string | null,
): PendingCreateDraft[] {
  const topic = text.slice(0, 80);
  return [
    makeDraft(
      "Clarify scope and success criteria",
      `From: ${topic}`,
      0,
      selfId,
      projectId,
    ),
    makeDraft(
      "Break work into concrete steps",
      "List dependencies and owners for each step.",
      1,
      selfId,
      projectId,
    ),
    makeDraft(
      "Schedule the first actions",
      "Set due dates for the earliest steps.",
      2,
      selfId,
      projectId,
    ),
    makeDraft(
      "Review progress and adjust",
      "Close loops on blockers before the next cycle.",
      4,
      selfId,
      projectId,
    ),
  ];
}

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

  const parts = splitExplicitList(trimmed);
  if (parts.length >= 2) {
    return {
      ok: true,
      drafts: parts.slice(0, AI_SUGGEST_TASKS_MAX).map((title, index) =>
        makeDraft(title, "", index, selfId, projectId),
      ),
    };
  }

  if (looksLikePlanning(trimmed)) {
    const drafts =
      /\b(stock\s*count|inventory)\b/i.test(trimmed) ||
      /\bweekly\b/i.test(trimmed)
        ? stockCountDrafts(selfId, projectId)
        : genericPlanDrafts(trimmed, selfId, projectId);
    return { ok: true, drafts: drafts.slice(0, AI_SUGGEST_TASKS_MAX) };
  }

  return {
    ok: true,
    drafts: [makeDraft(trimmed.slice(0, 200), "", 0, selfId, projectId)],
  };
}