import {
  openaiApiKey,
  openaiBaseUrl,
  openaiConfigured,
  openaiModel,
} from "@/lib/ingest/config";
import { resolveIngestHints } from "@/lib/ingest/resolve-hints";
import type {
  IngestContext,
  IngestTaskHint,
  PendingCreateDraft,
} from "@/lib/ingest/types";
import { TASK_DIFFICULTIES } from "@/lib/task-difficulty";

function promptLocale(locale: string): string {
  if (locale.startsWith("pt")) return "Portuguese";
  if (locale.startsWith("es")) return "Spanish";
  return "English";
}

function buildSystemPrompt(locale: string, ctx: IngestContext): string {
  const members = ctx.members.map((m) => m.label).join(", ") || "(none)";
  const projects = ctx.projects
    .map((p) => {
      const cats = p.categories.map((c) => c.name).join(", ");
      return cats
        ? `${p.acronym} · ${p.name} [categories: ${cats}]`
        : `${p.acronym} · ${p.name}`;
    })
    .join("; ");

  return [
    `You extract task create proposals from free text. Reply with JSON only.`,
    `User language: ${promptLocale(locale)}.`,
    `Allowed members (assigneeHint must match one of these labels, or omit): ${members}.`,
    `Allowed projects and categories (hints must match names/acronyms below, or omit): ${projects || "(none)"}.`,
    `Do not invent members, projects, or categories that are not listed.`,
    `dueDate must be YYYY-MM-DD when present. difficulty one of: ${TASK_DIFFICULTIES.join(", ")}.`,
    `Schema: {"tasks":[{"title":"string","description":"string?","assigneeHint":"string?","dueDate":"string?","difficulty":"easy|medium|hard?","projectHint":"string?","categoryHint":"string?"}]}`,
  ].join("\n");
}

function parseHints(payload: unknown): IngestTaskHint[] {
  if (!payload || typeof payload !== "object") return [];
  const tasks = (payload as { tasks?: unknown }).tasks;
  if (!Array.isArray(tasks)) return [];
  return tasks
    .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    .map((row) => ({
      title: typeof row.title === "string" ? row.title : "",
      description:
        typeof row.description === "string" ? row.description : undefined,
      assigneeHint:
        typeof row.assigneeHint === "string" ? row.assigneeHint : undefined,
      dueDate: typeof row.dueDate === "string" ? row.dueDate : undefined,
      difficulty:
        row.difficulty === "easy" ||
        row.difficulty === "medium" ||
        row.difficulty === "hard"
          ? row.difficulty
          : undefined,
      projectHint:
        typeof row.projectHint === "string" ? row.projectHint : undefined,
      categoryHint:
        typeof row.categoryHint === "string" ? row.categoryHint : undefined,
    }));
}

export type SuggestFromTextResult =
  | { ok: true; drafts: PendingCreateDraft[] }
  | { ok: false; error: "disabled" | "empty" | "upstream" | "invalid" };

export async function suggestTasksFromText(
  text: string,
  locale: string,
  ctx: IngestContext,
): Promise<SuggestFromTextResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "empty" };
  if (!openaiConfigured()) return { ok: false, error: "disabled" };

  const key = openaiApiKey();
  const model = openaiModel();
  if (!key || !model) return { ok: false, error: "disabled" };

  let response: Response;
  try {
    // No temperature: GPT-6 family rejects non-default values.
    response = await fetch(`${openaiBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt(locale, ctx) },
          { role: "user", content: trimmed.slice(0, 4000) },
        ],
      }),
    });
  } catch {
    return { ok: false, error: "upstream" };
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[ingest] openai", response.status, detail.slice(0, 300));
    return { ok: false, error: "upstream" };
  }

  let content: string;
  try {
    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    content = body.choices?.[0]?.message?.content?.trim() ?? "";
  } catch {
    return { ok: false, error: "invalid" };
  }

  if (!content) return { ok: false, error: "invalid" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { ok: false, error: "invalid" };
  }

  const drafts = resolveIngestHints(parseHints(parsed), ctx);
  if (drafts.length === 0) return { ok: false, error: "invalid" };
  return { ok: true, drafts };
}
