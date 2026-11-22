/**
 * Fail if served brand files drift from brand/ (canonical).
 * Run: npx tsx scripts/check-brand-public.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const PAIRS: { from: string; to: string }[] = [
  { from: "brand/logo.svg", to: "public/brand/logo.svg" },
  { from: "brand/logo-compact.svg", to: "public/brand/logo-compact.svg" },
  { from: "brand/icon.svg", to: "public/brand/icon.svg" },
  { from: "brand/icon.svg", to: "public/favicon.svg" },
];

for (const { from, to } of PAIRS) {
  const a = readFileSync(path.join(root, from));
  const b = readFileSync(path.join(root, to));
  assert.ok(
    a.equals(b),
    `${to} differs from ${from} — run: npx tsx scripts/sync-brand-public.ts`,
  );
}

console.log("check-brand-public: ok");
