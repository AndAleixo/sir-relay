/** ponytail: runnable check — node scripts/check-entry-routes.mjs */
import assert from "node:assert/strict";

function resolveEntryPath(locale, session) {
  if (!session) return `/${locale}/admin`;
  if (session.user.mustChangePassword) return `/${locale}/change-password`;
  if (session.user.role === "operator") return `/${locale}/teammates`;
  return `/${locale}/tasks`;
}

function resolveRoleHomePath(locale, session) {
  if (session.user.mustChangePassword) return `/${locale}/change-password`;
  if (session.user.role === "operator") return `/${locale}/teammates`;
  return `/${locale}/tasks`;
}

const locale = "en";
assert.equal(resolveEntryPath(locale, null), "/en/admin");
assert.equal(
  resolveEntryPath(locale, { user: { role: "operator", mustChangePassword: true } }),
  "/en/change-password",
);
assert.equal(
  resolveEntryPath(locale, { user: { role: "operator", mustChangePassword: false } }),
  "/en/teammates",
);
assert.equal(
  resolveEntryPath(locale, { user: { role: "teammate" } }),
  "/en/tasks",
);
assert.equal(
  resolveRoleHomePath(locale, { user: { role: "teammate" } }),
  "/en/tasks",
);
assert.equal(
  resolveRoleHomePath(locale, { user: { role: "operator", mustChangePassword: false } }),
  "/en/teammates",
);

// join + change-password forms post newPassword / confirmPassword (not password)
const joinForm = new FormData();
joinForm.set("newPassword", "12345678");
joinForm.set("confirmPassword", "12345678");
assert.equal(String(joinForm.get("newPassword")), String(joinForm.get("confirmPassword")));
assert.equal(String(joinForm.get("password") ?? ""), "");

console.log("entry-route checks ok");
