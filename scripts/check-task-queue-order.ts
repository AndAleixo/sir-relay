/**
 * Self-check: queue head + place-at-index (board drop semantics).
 * Run: npx tsx scripts/check-task-queue-order.ts
 */
import assert from "node:assert/strict";
import {
  buildTodoQueueOrder,
  insertIdAfter,
  placeIdAtIndex,
  pickQueueHead,
  sortByQueueOrder,
  TODO_QUEUE_APPEND,
} from "../src/lib/task-queue";

const base = {
  dueDate: null as string | null,
  createdAt: "2026-07-01T00:00:00Z",
};

const tasks = [
  {
    id: "a",
    assigneeId: "u1",
    status: "todo" as const,
    sortOrder: 0,
    ...base,
  },
  {
    id: "b",
    assigneeId: "u1",
    status: "todo" as const,
    sortOrder: 1,
    ...base,
  },
  {
    id: "c",
    assigneeId: "u1",
    status: "todo" as const,
    sortOrder: 2,
    ...base,
  },
];

assert.equal(pickQueueHead(tasks)?.id, "a");

assert.deepEqual(placeIdAtIndex(["a", "b", "c"], "c", 0), ["c", "a", "b"]);
assert.deepEqual(placeIdAtIndex(["a", "b", "c"], "a", 2), ["b", "c", "a"]);
assert.deepEqual(placeIdAtIndex(["a", "b", "c"], "b", 1), ["a", "b", "c"]);

assert.deepEqual(insertIdAfter(["a", "b", "c"], "a", "x"), ["a", "x", "b", "c"]);
assert.deepEqual(insertIdAfter(["a", "b", "c"], "c", "x"), ["a", "b", "c", "x"]);
assert.deepEqual(insertIdAfter(["a", "b"], "missing", "x"), ["a", "b", "x"]);

assert.deepEqual(buildTodoQueueOrder(tasks, "u1", "c", 0), ["c", "a", "b"]);
assert.deepEqual(
  buildTodoQueueOrder(tasks, "u1", "a", TODO_QUEUE_APPEND),
  ["b", "c", "a"],
);

const reordered = buildTodoQueueOrder(tasks, "u1", "c", 0);
const after = sortByQueueOrder(
  reordered.map((id, sortOrder) => ({
    id,
    assigneeId: "u1",
    status: "todo" as const,
    sortOrder,
    ...base,
  })),
);
assert.equal(pickQueueHead(after)?.id, "c");

const withDoing = [
  {
    id: "a",
    assigneeId: "u1",
    status: "todo" as const,
    sortOrder: 0,
    ...base,
  },
  {
    id: "d",
    assigneeId: "u1",
    status: "doing" as const,
    sortOrder: 5,
    ...base,
  },
];
assert.equal(pickQueueHead(withDoing)?.id, "d");

console.log("check-task-queue-order: ok");
