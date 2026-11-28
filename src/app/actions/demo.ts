"use server";

import { headers } from "next/headers";
import { AI_SUGGEST_TEXT_MAX } from "@/lib/ai-suggest-quota";
import {
  openaiConfigured,
  suggestTasksFromText,
  type IngestContext,
  type IngestMember,
  type IngestProject,
  type PendingCreateDraft,
} from "@/lib/ingest";
import {
  DEMO_AI_SUGGEST_IP_RATE,
  clientIpFromHeaders,
  consumeRateLimit,
  type RateLimitStore,
} from "@/lib/rate-limit";

/** ponytail: in-process; multi-instance → Redis later. */
const demoAiIpStore: RateLimitStore = new Map();

export type DemoSuggestContextInput = {
  defaultAssigneeId: string;
  members: { id: string; label: string }[];
  projects: {
    id: string;
    name: string;
    acronym: string;
    categories: { id: string; name: string }[];
  }[];
};

function sanitizeDemoContext(
  raw: DemoSuggestContextInput | null | undefined,
): IngestContext | null {
  if (!raw || typeof raw !== "object") return null;
  const defaultAssigneeId =
    typeof raw.defaultAssigneeId === "string"
      ? raw.defaultAssigneeId.trim().slice(0, 80)
      : "";
  if (!defaultAssigneeId) return null;

  const members: IngestMember[] = (Array.isArray(raw.members) ? raw.members : [])
    .slice(0, 20)
    .filter(
      (row): row is { id: string; label: string } =>
        !!row &&
        typeof row === "object" &&
        typeof row.id === "string" &&
        typeof row.label === "string",
    )
    .map((row) => ({
      id: row.id.trim().slice(0, 80),
      label: row.label.trim().slice(0, 80),
    }))
    .filter((row) => row.id && row.label);

  if (!members.some((row) => row.id === defaultAssigneeId)) return null;

  const projects: IngestProject[] = (
    Array.isArray(raw.projects) ? raw.projects : []
  )
    .slice(0, 20)
    .filter(
      (row): row is DemoSuggestContextInput["projects"][number] =>
        !!row &&
        typeof row === "object" &&
        typeof row.id === "string" &&
        typeof row.name === "string" &&
        typeof row.acronym === "string",
    )
    .map((row) => ({
      id: row.id.trim().slice(0, 80),
      name: row.name.trim().slice(0, 80),
      acronym: row.acronym.trim().slice(0, 12),
      categories: (Array.isArray(row.categories) ? row.categories : [])
        .slice(0, 20)
        .filter(
          (cat): cat is { id: string; name: string } =>
            !!cat &&
            typeof cat === "object" &&
            typeof cat.id === "string" &&
            typeof cat.name === "string",
        )
        .map((cat) => ({
          id: cat.id.trim().slice(0, 80),
          name: cat.name.trim().slice(0, 80),
        }))
        .filter((cat) => cat.id && cat.name),
    }))
    .filter((row) => row.id && row.name && row.acronym);

  return {
    role: "operator",
    defaultAssigneeId,
    members,
    projects,
  };
}

/**
 * Unauthenticated demo Ask AI — one real OpenAI call per IP (24h).
 * Logged-in product path stays on suggestTasksFromTextAction + user quota.
 */
export async function suggestDemoTasksFromTextAction(
  locale: string,
  text: string,
  context: DemoSuggestContextInput,
): Promise<
  | { ok: true; drafts: PendingCreateDraft[]; remaining: number; limit: number }
  | {
      ok: false;
      error:
        | "disabled"
        | "empty"
        | "upstream"
        | "invalid"
        | "too_long"
        | "quota"
        | "rate";
      remaining?: number;
      limit?: number;
    }
> {
  if (!openaiConfigured()) return { ok: false, error: "disabled" };

  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "empty" };
  if (trimmed.length > AI_SUGGEST_TEXT_MAX) {
    return { ok: false, error: "too_long" };
  }

  const ctx = sanitizeDemoContext(context);
  if (!ctx) return { ok: false, error: "invalid" };

  const ip = clientIpFromHeaders(await headers());
  const limited = consumeRateLimit(
    demoAiIpStore,
    `demo-ai:${ip}`,
    DEMO_AI_SUGGEST_IP_RATE.limit,
    DEMO_AI_SUGGEST_IP_RATE.windowMs,
  );
  if (!limited.ok) {
    return {
      ok: false,
      error: "rate",
      remaining: 0,
      limit: DEMO_AI_SUGGEST_IP_RATE.limit,
    };
  }

  const result = await suggestTasksFromText(trimmed, locale, ctx);
  if (!result.ok) {
    // Refund the IP slot only for upstream/invalid so a flaky model doesn't burn the one shot.
    if (result.error === "upstream" || result.error === "invalid") {
      demoAiIpStore.delete(`demo-ai:${ip}`);
    }
    return result;
  }

  return {
    ok: true,
    drafts: result.drafts,
    remaining: 0,
    limit: DEMO_AI_SUGGEST_IP_RATE.limit,
  };
}
