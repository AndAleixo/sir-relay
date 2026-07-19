/**
 * Self-check: audit helpers + group activity filter (P2-AUD).
 * Run: npx tsx scripts/check-audit.ts
 */
import assert from "node:assert/strict";
import {
  actorTypeFromRole,
  isGroupActivityAction,
} from "../src/domain/audit";
import { describeGroupActivity } from "../src/lib/activity-copy";
import { listAuditForGroup, writeAudit } from "../src/lib/audit";

assert.equal(actorTypeFromRole("operator"), "operator");
assert.equal(actorTypeFromRole("teammate"), "teammate");
assert.equal(actorTypeFromRole(null), "system");
assert.equal(isGroupActivityAction("task_status"), true);
assert.equal(isGroupActivityAction("login"), false);

async function main() {
  process.env.NEXT_PUBLIC_SERVICE_MODE = "mock";

  await writeAudit({
    groupId: "g-audit",
    action: "login",
    actorType: "operator",
    actorId: "u1",
  });
  await writeAudit({
    groupId: "g-audit",
    action: "task_status",
    actorType: "operator",
    actorId: "u1",
    metadata: { taskId: "t1", title: "Prep shelf", from: "todo", to: "doing" },
  });

  const all = await listAuditForGroup("g-audit", { page: 1, pageSize: 10 });
  assert.equal(all.total, 2);

  const activity = await listAuditForGroup("g-audit", {
    page: 1,
    pageSize: 10,
    activityOnly: true,
  });
  assert.equal(activity.total, 1);
  assert.equal(activity.entries[0]?.action, "task_status");

  const message = describeGroupActivity(activity.entries[0]!, {
    taskTitles: new Map(),
    userNames: new Map([["u1", "Andre"]]),
    statusLabel: (s) => (s === "todo" ? "To do" : s === "doing" ? "In progress" : s),
  });
  assert.ok(message);
  assert.equal(message.key, "task_status");
  assert.equal(message.values.task, "Prep shelf");
  assert.equal(message.values.from, "To do");

  console.log("check-audit: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
