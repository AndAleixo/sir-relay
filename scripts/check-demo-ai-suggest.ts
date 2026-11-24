/**
 * Self-check: demo Ask AI draft split (no OpenAI).
 * Run: npx tsx scripts/check-demo-ai-suggest.ts
 *
 * Also guards the compose drawer: resetting drafts on aiRemaining/aiLimit
 * would wipe review cards when demo bumps quota after suggest.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { DEMO_AI_MONTHLY_LIMIT, demoSuggestDrafts } from "../src/lib/demo-ai-suggest";

assert.equal(DEMO_AI_MONTHLY_LIMIT, 5);

const drawerSrc = readFileSync(
  path.join(process.cwd(), "src/components/tasks/task-compose-drawer/task-compose-drawer.tsx"),
  "utf8",
);
assert.match(
  drawerSrc,
  /setAiItems\(\[\]\);\s*setAiText\(""\);\s*setError\(null\);\s*setBusy\(null\);\s*\}, \[open, mode, selfId, defaultProjectId\]\);/,
  "draft reset must not depend on aiRemaining/aiLimit",
);

const multi = demoSuggestDrafts(
  "Restock the shelf. Call the supplier. Confirm inventory.",
  "self",
  null,
);
assert.equal(multi.ok, true);
if (multi.ok) {
  assert.equal(multi.drafts.length, 3);
  assert.equal(multi.drafts[0]?.title, "Restock the shelf");
  assert.equal(multi.drafts[0]?.assigneeId, "self");
}

const tooLong = demoSuggestDrafts("x".repeat(400), "self", "p1");
assert.equal(tooLong.ok, false);
if (!tooLong.ok) assert.equal(tooLong.error, "too_long");

const empty = demoSuggestDrafts("   ", "self", null);
assert.equal(empty.ok, false);

console.log("check-demo-ai-suggest: ok");
