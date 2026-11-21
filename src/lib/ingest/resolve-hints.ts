import { parseTaskDifficulty } from "@/lib/task-difficulty";
import type {
  IngestContext,
  IngestTaskHint,
  PendingCreateDraft,
} from "@/lib/ingest/types";

function norm(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function matchByLabel<T extends { id: string }>(
  hint: string | undefined,
  items: T[],
  labels: (item: T) => string[],
): string | null {
  if (!hint?.trim()) return null;
  const needle = norm(hint);
  const exact = items.find((item) =>
    labels(item).some((label) => norm(label) === needle),
  );
  if (exact) return exact.id;
  const partial = items.find((item) =>
    labels(item).some((label) => {
      const n = norm(label);
      return n.includes(needle) || needle.includes(n);
    }),
  );
  return partial?.id ?? null;
}

function resolveAssigneeId(
  hint: string | undefined,
  ctx: IngestContext,
): string {
  if (ctx.role === "teammate") return ctx.defaultAssigneeId;
  const matched = matchByLabel(hint, ctx.members, (m) => [m.label]);
  return matched ?? ctx.defaultAssigneeId;
}

function resolveProjectAndCategory(
  projectHint: string | undefined,
  categoryHint: string | undefined,
  ctx: IngestContext,
): { projectId: string | null; categoryId: string | null } {
  const projectId = matchByLabel(projectHint, ctx.projects, (p) => [
    p.name,
    p.acronym,
    `${p.acronym} · ${p.name}`,
  ]);

  if (!categoryHint?.trim()) {
    return { projectId, categoryId: null };
  }

  if (projectId) {
    const project = ctx.projects.find((p) => p.id === projectId);
    const categoryId = project
      ? matchByLabel(categoryHint, project.categories, (c) => [c.name])
      : null;
    return { projectId, categoryId };
  }

  // Unique category name across open projects
  const hits = ctx.projects.flatMap((p) =>
    p.categories
      .filter((c) => norm(c.name) === norm(categoryHint))
      .map((c) => ({ projectId: p.id, categoryId: c.id })),
  );
  if (hits.length === 1) return hits[0];
  return { projectId: null, categoryId: null };
}

function parseDueDate(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function resolveIngestHints(
  hints: IngestTaskHint[],
  ctx: IngestContext,
): PendingCreateDraft[] {
  return hints
    .map((hint) => {
      const title = hint.title?.trim() ?? "";
      if (!title) return null;
      const { projectId, categoryId } = resolveProjectAndCategory(
        hint.projectHint,
        hint.categoryHint,
        ctx,
      );
      return {
        title: title.slice(0, 200),
        description: hint.description?.trim() ?? "",
        assigneeId: resolveAssigneeId(hint.assigneeHint, ctx),
        dueDate: parseDueDate(hint.dueDate),
        difficulty: parseTaskDifficulty(hint.difficulty ?? ""),
        projectId,
        categoryId,
      } satisfies PendingCreateDraft;
    })
    .filter((draft): draft is PendingCreateDraft => draft !== null);
}
