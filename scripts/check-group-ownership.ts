/**
 * Self-check: ownership succession pick order.
 * Run: npx tsx scripts/check-group-ownership.ts
 */
import assert from "node:assert/strict";
import { pickOwnershipSuccessorId } from "../src/lib/group-ownership";

const members = [
  { userId: "owner", role: "operator" as const, createdAt: "2026-01-01" },
  { userId: "op-new", role: "operator" as const, createdAt: "2026-06-01" },
  { userId: "tm-old", role: "teammate" as const, createdAt: "2026-02-01" },
];

assert.equal(
  pickOwnershipSuccessorId(members, "owner"),
  "op-new",
  "prefers other operator over older teammate",
);

assert.equal(
  pickOwnershipSuccessorId(
    [
      { userId: "owner", role: "operator", createdAt: "2026-01-01" },
      { userId: "tm-b", role: "teammate", createdAt: "2026-03-01" },
      { userId: "tm-a", role: "teammate", createdAt: "2026-02-01" },
    ],
    "owner",
  ),
  "tm-a",
  "falls back to oldest teammate",
);

assert.equal(pickOwnershipSuccessorId(members, "owner"), "op-new");
assert.equal(pickOwnershipSuccessorId([{ userId: "solo", role: "operator", createdAt: 1 }], "solo"), null);

console.log("check-group-ownership: ok");
