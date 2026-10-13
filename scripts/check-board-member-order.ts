/**
 * Self-check: Team board member column order at page open.
 * Run: npx tsx scripts/check-board-member-order.ts
 */
import assert from "node:assert/strict";
import { orderMembersByTodoCount } from "../src/lib/board-member-order";

const members = [
  { id: "ana", name: "Ana" },
  { id: "bruno", name: "Bruno" },
  { id: "carla", name: "Carla" },
];

const ordered = orderMembersByTodoCount(
  members,
  [
    { assigneeId: "bruno", status: "todo" },
    { assigneeId: "bruno", status: "todo" },
    { assigneeId: "carla", status: "todo" },
    { assigneeId: "ana", status: "doing" },
  ],
  (m) => m.name,
);

assert.deepEqual(
  ordered.map((m) => m.id),
  ["bruno", "carla", "ana"],
);

console.log("check-board-member-order: ok");
