import assert from "node:assert/strict";
import type { Task } from "../src/domain/types";
import { isRetryableSyncError } from "../src/domain/sync";
import {
  applyServerTasks,
  shouldAcceptServerSnapshot,
} from "../src/lib/sync/merge-tasks";

function task(partial: Partial<Task> & Pick<Task, "id" | "updatedAt">): Task {
  return {
    title: "t",
    description: "",
    assigneeId: "u1",
    assigneeName: "A",
    status: "todo",
    difficulty: null,
    dueDate: null,
    telegramNotifyFailed: false,
    sortOrder: 0,
    projectId: null,
    projectAcronym: null,
    categoryId: null,
    categoryName: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function main() {
  // LWW: newer server wins; older server does not wipe newer local optimism.
  const local = [
    task({ id: "a", updatedAt: "2026-01-02T00:00:00.000Z", status: "doing", assigneeId: "u2" }),
    task({ id: "b", updatedAt: "2026-01-01T00:00:00.000Z", title: "B" }),
  ];
  const incoming = [
    task({ id: "a", updatedAt: "2026-01-01T12:00:00.000Z", status: "todo", assigneeId: "u1" }),
    task({ id: "b", updatedAt: "2026-01-02T00:00:00.000Z", title: "B2" }),
  ];
  const merged = applyServerTasks(local, incoming);
  assert.equal(merged.find((t) => t.id === "a")?.assigneeId, "u2");
  assert.equal(merged.find((t) => t.id === "a")?.status, "doing");
  assert.equal(merged.find((t) => t.id === "b")?.title, "B2");

  // Equal updatedAt: server wins (confirm).
  const equal = applyServerTasks(
    [task({ id: "c", updatedAt: "2026-01-01T00:00:00.000Z", title: "local" })],
    [task({ id: "c", updatedAt: "2026-01-01T00:00:00.000Z", title: "server" })],
  );
  assert.equal(equal[0]?.title, "server");

  assert.equal(
    shouldAcceptServerSnapshot({ queueLength: 0, inFlightCount: 0 }),
    true,
  );
  assert.equal(
    shouldAcceptServerSnapshot({ queueLength: 1, inFlightCount: 0 }),
    false,
  );
  assert.equal(
    shouldAcceptServerSnapshot({ queueLength: 0, inFlightCount: 2 }),
    false,
  );

  assert.equal(isRetryableSyncError("network"), true);
  assert.equal(isRetryableSyncError("forbidden"), false);
  assert.equal(isRetryableSyncError("unauthorized"), false);
  assert.equal(isRetryableSyncError("not_found"), false);
  assert.equal(isRetryableSyncError("conflict"), false);

  console.log("check-sync-merge: ok");
}

main();
