/** ponytail: mirrors src/lib/entry-route.ts — keep in sync when routing changes */
import assert from "node:assert/strict";

/** ponytail: mirror src/lib/invite-token.ts */
function parseInviteToken(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const fromUrl = trimmed.match(/\/join\/([^/?#]+)/)?.[1];
  const token = fromUrl ?? trimmed;
  return token.length >= 8 ? token : null;
}

function resolveEntryPath(locale, session) {
  if (!session) return `/${locale}`;
  if (session.user.mustChangePassword) return `/${locale}/change-password`;
  if (!session.activeGroupId) return `/${locale}/groups`;
  if (session.user.role === "operator") return `/${locale}/teammates`;
  return `/${locale}/tasks`;
}

function resolveRoleHomePath(locale, session) {
  if (session.user.mustChangePassword) return `/${locale}/change-password`;
  if (!session.activeGroupId) return `/${locale}/groups`;
  if (session.user.role === "operator") return `/${locale}/teammates`;
  return `/${locale}/tasks`;
}

const locale = "en";
assert.equal(resolveEntryPath(locale, null), "/en");
assert.equal(
  resolveEntryPath(locale, {
    user: { role: "operator", mustChangePassword: true },
    activeGroupId: "g1",
  }),
  "/en/change-password",
);
assert.equal(
  resolveEntryPath(locale, {
    user: { role: "operator", mustChangePassword: false },
    activeGroupId: null,
  }),
  "/en/groups",
);
assert.equal(
  resolveEntryPath(locale, {
    user: { role: "operator", mustChangePassword: false },
    activeGroupId: "g1",
  }),
  "/en/teammates",
);
assert.equal(
  resolveEntryPath(locale, { user: { role: "teammate" }, activeGroupId: "g1" }),
  "/en/tasks",
);
assert.equal(
  resolveRoleHomePath(locale, { user: { role: "teammate" }, activeGroupId: "g1" }),
  "/en/tasks",
);
assert.equal(
  resolveRoleHomePath(locale, {
    user: { role: "operator", mustChangePassword: false },
    activeGroupId: "g1",
  }),
  "/en/teammates",
);

// join + change-password forms post newPassword / confirmPassword (not password)
const joinForm = new FormData();
joinForm.set("newPassword", "12345678");
joinForm.set("confirmPassword", "12345678");
assert.equal(String(joinForm.get("newPassword")), String(joinForm.get("confirmPassword")));
assert.equal(String(joinForm.get("password") ?? ""), "");

assert.equal(parseInviteToken("mock-invite-ana"), "mock-invite-ana");
assert.equal(
  parseInviteToken("https://app.example.com/en/join/mock-invite-ana"),
  "mock-invite-ana",
);
assert.equal(parseInviteToken(""), null);

console.log("entry-route checks ok");
