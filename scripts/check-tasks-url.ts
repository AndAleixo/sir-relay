/**
 * Self-check: tasks list URL parse + href.
 * Run: npx tsx scripts/check-tasks-url.ts
 */
import assert from "node:assert/strict";
import {
  coerceTasksScope,
  coerceTasksView,
  parseTasksScope,
  parseTasksView,
  taskDetailHref,
  taskNewHref,
  tasksListHref,
  tasksListHrefFromReturn,
} from "../src/lib/tasks-url";

assert.equal(parseTasksScope(undefined, "operator"), "team");
assert.equal(parseTasksScope(undefined, "teammate"), "mine");
assert.equal(parseTasksScope("mine", "operator"), "mine");
assert.equal(parseTasksScope("nope", "teammate"), "mine");
assert.equal(parseTasksView(undefined), "board");
assert.equal(parseTasksView("list"), "list");
assert.equal(coerceTasksScope(undefined), "team");
assert.equal(coerceTasksView("list"), "list");

assert.equal(
  tasksListHref("en-gb", { scope: "mine", view: "list", saved: true }),
  "/en-gb/tasks?scope=mine&view=list&saved=1",
);
assert.equal(
  taskDetailHref("pt-br", "t1", { scope: "team", view: "board", renotify: true }),
  "/pt-br/tasks/t1?scope=team&view=board&renotify=1",
);
assert.equal(
  taskNewHref("es-es", { scope: "mine", view: "list", error: "title" }),
  "/es-es/tasks/new?scope=mine&view=list&error=title",
);
assert.equal(
  tasksListHrefFromReturn("en-gb", "operator", undefined, undefined, {
    deleted: true,
  }),
  "/en-gb/tasks?scope=team&view=board&deleted=1",
);

console.log("check-tasks-url: ok");
