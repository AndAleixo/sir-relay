/**
 * Copy canonical brand SVGs into public/ for HTTP serving.
 * Source of truth: brand/ · Served: public/brand/* + public/favicon.svg
 * Run: npx tsx scripts/sync-brand-public.ts
 */
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const COPIES: { from: string; to: string }[] = [
  { from: "brand/logo.svg", to: "public/brand/logo.svg" },
  { from: "brand/logo-compact.svg", to: "public/brand/logo-compact.svg" },
  { from: "brand/icon.svg", to: "public/brand/icon.svg" },
  { from: "brand/icon.svg", to: "public/favicon.svg" },
];

mkdirSync(path.join(root, "public/brand"), { recursive: true });

for (const { from, to } of COPIES) {
  copyFileSync(path.join(root, from), path.join(root, to));
  console.log(`${from} → ${to}`);
}

console.log("sync-brand-public: ok");
