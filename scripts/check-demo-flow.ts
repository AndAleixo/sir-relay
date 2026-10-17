/**
 * Self-check: try-demo workspace stays local (P1-DEMO-*).
 * Run: npx tsx scripts/check-demo-flow.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createDemoWorkspace,
  demoAddMember,
  demoAlerts,
  demoCreateProject,
  demoCreateTask,
  demoMemberAsUser,
  demoPatchTask,
  parseDemoPresets,
} from "../src/lib/demo-workspace";
import { isNavItemActive } from "../src/lib/navigation";

function presetsFor(locale: string) {
  const json = JSON.parse(
    readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"),
  ) as { demo: { presets: unknown } };
  return parseDemoPresets(json.demo.presets);
}

const byLocale = ["en-gb", "pt-br", "es-es"].map(presetsFor);
assert.ok(byLocale[0]!.length >= 6);
const ids = byLocale[0]!.map((option) => option.id).join();
for (const options of byLocale) {
  assert.equal(options.map((option) => option.id).join(), ids);
  for (const option of options) {
    const built = createDemoWorkspace("Alex", option.seed);
    assert.equal(built.members.length, 1 + option.seed.teammates.length);
    assert.equal(built.tasks.length, option.seed.tasks.length);
    assert.equal(built.projects.length, option.seed.projects.length);
    assert.equal(demoAlerts(built.tasks).some((alert) => alert.type === "task_done"), false);
    assert.ok(demoAlerts(built.tasks).some((alert) => alert.type === "task_due"));
  }
}

const personal = byLocale[0]!.find((option) => option.id === "personal")!;
const ws = createDemoWorkspace("Alex", personal.seed);
assert.equal(ws.tasks[0]!.assigneeId, ws.selfId);
const longName = createDemoWorkspace("A".repeat(50), personal.seed);
assert.equal(longName.members[0]!.name.length, 40);
assert.throws(() => createDemoWorkspace("A", personal.seed));
const done = demoPatchTask(ws, ws.tasks[0]!.id, { status: "done" });
assert.equal(demoAlerts(done.tasks).some((alert) => alert.type === "task_done"), true);
const self = ws.members.find((member) => member.id === ws.selfId)!;
const ana = ws.members.find((member) => member.name === "Ana")!;
assert.equal(demoMemberAsUser(self, ws.selfId, "en-gb").email, "demo@sirrelay.local");
assert.equal(demoMemberAsUser(ana, ws.selfId, "en-gb").email, "ana@demo.local");

const titled = ws.tasks[0]!;
const patched = demoPatchTask(ws, titled.id, {
  dueDate: "2026-10-17",
  title: undefined,
});
assert.equal(patched.tasks[0]!.title, titled.title);
assert.equal(patched.tasks[0]!.dueDate, "2026-10-17");

assert.equal(demoAddMember(ws, "A"), null);
const withCarla = demoAddMember(ws, "Carla");
assert.ok(withCarla);
assert.equal(withCarla!.members.length, ws.members.length + 1);

const bad = demoCreateProject(ws, { name: "Floor", acronym: "12" });
assert.equal(bad.error, "acronym");
assert.equal(bad.workspace.projects.length, ws.projects.length);

const created = demoCreateTask(ws, {
  title: "Sweep",
  assigneeId: ws.selfId,
  projectId: ws.projects[0]!.id,
  dueDate: "2026-10-20",
  description: "Front door",
  difficulty: "easy",
});
assert.equal(created.tasks.length, ws.tasks.length + 1);
assert.equal(created.tasks.at(-1)!.projectAcronym, ws.projects[0]!.acronym);
assert.equal(created.tasks.at(-1)!.dueDate, "2026-10-20");
assert.equal(created.tasks.at(-1)!.difficulty, "easy");
assert.equal(demoCreateTask(ws, { title: "  ", assigneeId: ws.selfId }), ws);

const home = "/en-gb/demo/app";
assert.equal(isNavItemActive(`${home}/teammates`, home, home), false);
assert.equal(isNavItemActive(home, home, home), true);
assert.equal(isNavItemActive("/en-gb/tasks/abc", "/en-gb/tasks"), true);

console.log("check-demo-flow: ok");
