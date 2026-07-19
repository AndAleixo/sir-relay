/**
 * Self-check: authz helpers (P2-SEC-01).
 * Run: npx tsx scripts/check-authz.ts
 */
import assert from "node:assert/strict";
import type { Session } from "../src/domain/types";
import {
  requireActiveGroupId,
  requireOperator,
  requireSelfUserId,
} from "../src/lib/authz";

function session(partial: Partial<Session["user"]> & { role: "operator" | "teammate" }): Session {
  return {
    user: {
      id: "u1",
      name: "Sam",
      email: "sam@example.com",
      locale: "en-gb",
      active: true,
      ...partial,
    },
    activeGroupId: "g1",
  };
}

assert.equal(requireActiveGroupId(session({ role: "teammate" })), "g1");
assert.throws(() => requireActiveGroupId({ ...session({ role: "teammate" }), activeGroupId: null }));

assert.equal(requireOperator(session({ role: "operator" })), "g1");
assert.throws(() => requireOperator(session({ role: "teammate" })), /Forbidden/);

assert.doesNotThrow(() => requireSelfUserId(session({ role: "operator" }), "u1"));
assert.throws(() => requireSelfUserId(session({ role: "operator" }), "other"), /Forbidden/);

console.log("check-authz: ok");
