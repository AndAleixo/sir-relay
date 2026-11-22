/**
 * Self-check: web app manifest + brand mark (P3-14).
 * Run: npx tsx scripts/check-pwa.ts
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import manifest from "../src/app/manifest";

const m = manifest();
assert.equal(m.name, "SRelay");
assert.equal(m.short_name, "SRelay");
assert.equal(m.display, "standalone");
assert.equal(m.theme_color, "#EAB308");
assert.equal(m.background_color, "#F5F5F5");
assert.equal(m.start_url, "/");

const icons = m.icons ?? [];
assert.ok(icons.some((i) => i.src === "/brand/icon.svg"));
assert.ok(
  icons.every((i) => i.type === "image/svg+xml"),
  "manifest icons must use brand SVG (no generated PNGs)",
);

assert.ok(existsSync(path.join(process.cwd(), "public/brand/icon.svg")));
assert.ok(existsSync(path.join(process.cwd(), "brand/icon.svg")));
assert.ok(
  !existsSync(path.join(process.cwd(), "brand/bot-avatar.svg")),
  "bot-avatar.svg removed — use brand/icon.svg",
);
assert.ok(
  !existsSync(path.join(process.cwd(), "public/icons")),
  "public/icons/ removed — use brand mark",
);

console.log("check-pwa: ok");
