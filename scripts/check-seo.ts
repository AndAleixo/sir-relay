/**
 * Self-check: public sitemap paths + robots disallow + bar threshold helpers.
 * Run: npx tsx scripts/check-seo.ts
 */
import assert from "node:assert/strict";
import robots from "../src/app/robots";
import sitemap from "../src/app/sitemap";
import { siteOrigin, siteUrl } from "../src/lib/site";
import { publicPageAlternates } from "../src/lib/seo";

assert.equal(siteUrl("/en-gb"), `${siteOrigin()}/en-gb`);

const map = sitemap();
assert.ok(map.some((e) => e.url.endsWith("/en-gb")));
assert.ok(map.some((e) => e.url.endsWith("/pt-br/demo")));
assert.ok(!map.some((e) => e.url.includes("/tasks")));

const bot = robots();
assert.equal(bot.sitemap, `${siteOrigin()}/sitemap.xml`);
const disallow = Array.isArray(bot.rules)
  ? bot.rules[0]?.disallow
  : bot.rules.disallow;
assert.ok(
  Array.isArray(disallow) &&
    disallow.includes("/*/tasks") &&
    disallow.includes("/api/"),
);

const alts = publicPageAlternates("pt-br", "/contact");
assert.equal(alts?.canonical, `${siteOrigin()}/pt-br/contact`);
assert.equal(
  (alts?.languages as Record<string, string>)?.["x-default"],
  `${siteOrigin()}/en-gb/contact`,
);

console.log("check-seo: ok");
