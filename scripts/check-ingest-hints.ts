/**
 * Self-check: ingest hint → PendingCreateDraft resolution.
 * Run: npx tsx scripts/check-ingest-hints.ts
 */
import assert from "node:assert/strict";
import { resolveIngestHints } from "../src/lib/ingest/resolve-hints";
import type { IngestContext } from "../src/lib/ingest/types";

const ctx: IngestContext = {
  defaultAssigneeId: "me",
  role: "operator",
  members: [
    { id: "me", label: "Me (Andre)" },
    { id: "ana", label: "Ana" },
    { id: "luis", label: "Luis" },
  ],
  projects: [
    {
      id: "p-hom",
      name: "Home",
      acronym: "HOM",
      categories: [
        { id: "c-bills", name: "Bills" },
        { id: "c-fix", name: "Chores" },
      ],
    },
    {
      id: "p-fam",
      name: "Family",
      acronym: "FAM",
      categories: [{ id: "c-kids", name: "Kids" }],
    },
  ],
};

const drafts = resolveIngestHints(
  [
    {
      title: "Pay electricity",
      assigneeHint: "Ana",
      projectHint: "HOM",
      categoryHint: "Bills",
      difficulty: "easy",
      dueDate: "2026-12-01",
    },
    {
      title: "  ",
      assigneeHint: "Luis",
    },
    {
      title: "School run",
      projectHint: "Family",
      categoryHint: "Kids",
    },
  ],
  ctx,
);

assert.equal(drafts.length, 2);
assert.equal(drafts[0].assigneeId, "ana");
assert.equal(drafts[0].projectId, "p-hom");
assert.equal(drafts[0].categoryId, "c-bills");
assert.equal(drafts[0].difficulty, "easy");
assert.equal(drafts[0].dueDate, "2026-12-01");
assert.equal(drafts[1].assigneeId, "me"); // no hint → default
assert.equal(drafts[1].projectId, "p-fam");
assert.equal(drafts[1].categoryId, "c-kids");

const teammate = resolveIngestHints(
  [{ title: "Only me", assigneeHint: "Ana" }],
  { ...ctx, role: "teammate", defaultAssigneeId: "me" },
);
assert.equal(teammate[0].assigneeId, "me");

console.log("check-ingest-hints: ok");
