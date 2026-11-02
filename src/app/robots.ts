import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site";

/** Public marketing + auth entry; everything else stays out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/*/tasks",
        "/*/teammates",
        "/*/projects",
        "/*/settings",
        "/*/profile",
        "/*/events",
        "/*/groups",
        "/*/platform",
        "/*/connect",
        "/*/join/",
        "/*/demo/app",
        "/*/change-password",
        "/*/accept-terms",
        "/*/forgot-password",
        "/*/reset-password",
        "/*/verify-email",
        "/*/check-email",
      ],
    },
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
