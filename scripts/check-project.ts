/**
 * Assert project acronym/name parse and task heading. Run: npx tsx scripts/check-project.ts
 */
import assert from "node:assert/strict";
import {
  formatTaskHeading,
  isPendingProject,
  MAX_OPEN_PROJECTS,
  MAX_PENDING_PROJECTS,
  parseProjectAcronym,
  parseProjectName,
  PROJECT_ACRONYM_MAX,
  PROJECT_NAME_MAX,
  resolveStoredProjectId,
  sortProjectsForSettings,
  tagFromOpenProjects,
} from "../src/lib/project";
import { parseTasksProject, tasksListHref } from "../src/lib/tasks-url";

assert.equal(MAX_OPEN_PROJECTS, 8);
assert.equal(MAX_PENDING_PROJECTS, 2);
assert.equal(PROJECT_NAME_MAX, 20);
assert.equal(PROJECT_ACRONYM_MAX, 3);

assert.equal(
  isPendingProject({ archivedAt: null, pendingAt: "2026-08-16T00:00:00Z" }),
  true,
);
assert.equal(isPendingProject({ archivedAt: null, pendingAt: null }), false);
assert.deepEqual(
  sortProjectsForSettings([
    { pendingAt: null, id: "a" },
    { pendingAt: "2026-08-16T00:00:00Z", id: "p" },
  ]).map((row) => row.id),
  ["p", "a"],
);

assert.equal(parseProjectAcronym("a"), "A");
assert.equal(parseProjectAcronym("shp"), "SHP");
assert.equal(parseProjectAcronym(" WEB "), "WEB");
assert.equal(parseProjectAcronym("shop"), null);
assert.equal(parseProjectAcronym("TOOLS"), null);
assert.equal(parseProjectAcronym("S1"), null);
assert.equal(parseProjectAcronym(""), null);

assert.equal(parseProjectName("  Floor  "), "Floor");
assert.equal(parseProjectName(""), null);
assert.equal(parseProjectName("   "), null);
assert.equal((parseProjectName("x".repeat(50)) ?? "").length, PROJECT_NAME_MAX);

assert.equal(formatTaskHeading("Fix login", "SIR"), "SIR · Fix login");
assert.equal(formatTaskHeading("Fix login", null), "Fix login");
assert.equal(formatTaskHeading("Fix login", "  "), "Fix login");

assert.deepEqual(tagFromOpenProjects(null, [{ id: "p1", acronym: "SHP" }]), {
  projectId: null,
  projectAcronym: null,
});
assert.deepEqual(
  tagFromOpenProjects("p1", [{ id: "p1", acronym: "SHP" }]),
  { projectId: "p1", projectAcronym: "SHP" },
);
assert.deepEqual(
  tagFromOpenProjects("old", [], { id: "old", acronym: "ARC" }),
  { projectId: "old", projectAcronym: "ARC" },
);

assert.equal(resolveStoredProjectId("", "p1", ["p2"]), null);
assert.equal(resolveStoredProjectId("p1", "p1", ["p2"]), "p1");
assert.equal(resolveStoredProjectId("p2", "p1", ["p2"]), "p2");
assert.throws(() => resolveStoredProjectId("p3", "p1", ["p2"]));

assert.equal(parseTasksProject(undefined, ["project-shop"]), null);
assert.equal(parseTasksProject("project-shop", ["project-shop"]), "project-shop");
assert.equal(parseTasksProject("project-web", ["project-shop"]), null);

assert.equal(
  tasksListHref("en-gb", {
    scope: "team",
    view: "board",
    project: "project-shop",
  }),
  "/en-gb/tasks?scope=team&view=board&project=project-shop",
);
assert.equal(
  tasksListHref("en-gb", { scope: "team", view: "board", project: null }),
  "/en-gb/tasks?scope=team&view=board",
);

console.log("ok: project");
