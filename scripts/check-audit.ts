/**
 * Self-check: audit helpers (P2-AUD).
 * Run: npx tsx scripts/check-audit.ts
 */
import assert from "node:assert/strict";
import { actorTypeFromRole } from "../src/domain/audit";
import { listAuditForGroup, writeAudit } from "../src/lib/audit";

assert.equal(actorTypeFromRole("operator"), "operator");
assert.equal(actorTypeFromRole("teammate"), "teammate");
assert.equal(actorTypeFromRole(null), "system");

async function main() {
  process.env.NEXT_PUBLIC_SERVICE_MODE = "mock";

  await writeAudit({
    groupId: "g-audit",
    action: "login",
    actorType: "operator",
    actorId: "u1",
    metadata: { ok: true },
  });

  const listed = await listAuditForGroup("g-audit", { page: 1, pageSize: 10 });
  assert.equal(listed.total, 1);
  assert.equal(listed.entries[0]?.action, "login");
  assert.equal(listed.entries[0]?.metadata.ok, true);
  assert.equal(listed.entries[0]?.metadata.password, undefined);

  const other = await listAuditForGroup("g-other");
  assert.equal(other.total, 0);

  console.log("check-audit: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
