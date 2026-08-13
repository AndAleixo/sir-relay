/**
 * Assert task difficulty parsing. Run: npx tsx scripts/check-task-difficulty.ts
 */
import assert from "node:assert/strict";
import { parseTaskDifficulty, TASK_DIFFICULTIES } from "../src/lib/task-difficulty";
import { taskNotify } from "../src/lib/telegram/copy";

assert.deepEqual([...TASK_DIFFICULTIES], ["easy", "medium", "hard"]);
assert.equal(parseTaskDifficulty(null), null);
assert.equal(parseTaskDifficulty(""), null);
assert.equal(parseTaskDifficulty("  "), null);
assert.equal(parseTaskDifficulty("Easy"), null);
assert.equal(parseTaskDifficulty("easy"), "easy");
assert.equal(parseTaskDifficulty("medium"), "medium");
assert.equal(parseTaskDifficulty("hard"), "hard");

const withDiff = taskNotify("en", {
  title: "Restock",
  description: "",
  dueDate: null,
  difficulty: "hard",
  groupName: "Demo",
  taskUrl: "https://example.com/t",
});
assert.match(withDiff, /Difficulty: Hard/);

const withoutDiff = taskNotify("en", {
  title: "Restock",
  description: "",
  dueDate: null,
  difficulty: null,
  groupName: "Demo",
  taskUrl: "https://example.com/t",
});
assert.equal(withoutDiff.includes("Difficulty:"), false);

console.log("ok: task difficulty");
