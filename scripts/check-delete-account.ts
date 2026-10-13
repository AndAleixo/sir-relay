/**
 * Self-check: ownership succession + leave-all prelude for account delete (P1-AUTH-15).
 * Run: npx tsx scripts/check-delete-account.ts
 */
import assert from "node:assert/strict";
import { pickOwnershipSuccessorId } from "../src/lib/group-ownership";

const members = [
  { userId: "owner", role: "operator" as const, createdAt: 1 },
  { userId: "op2", role: "operator" as const, createdAt: 2 },
  { userId: "tm", role: "teammate" as const, createdAt: 0 },
];

assert.equal(pickOwnershipSuccessorId(members, "owner"), "op2");
assert.equal(
  pickOwnershipSuccessorId(
    [
      { userId: "owner", role: "operator", createdAt: 1 },
      { userId: "tm", role: "teammate", createdAt: 0 },
    ],
    "owner",
  ),
  "tm",
);
assert.equal(
  pickOwnershipSuccessorId([{ userId: "solo", role: "operator", createdAt: 0 }], "solo"),
  null,
);

console.log("check-delete-account: ok");
