import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { siteUrl } from "@/lib/site";

/** Indexable marketing / entry URLs only (per locale). */
const PUBLIC_PATHS = [
  "",
  "/contact",
  "/privacy",
  "/terms",
  "/demo",
  "/login",
  "/signup",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of PUBLIC_PATHS) {
      entries.push({
        url: siteUrl(`/${locale}${path}`),
        lastModified,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : path === "/demo" || path === "/signup" ? 0.8 : 0.6,
      });
    }
  }

  return entries;
}
