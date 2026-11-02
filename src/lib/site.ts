/** Canonical public origin (sitemap, robots, Open Graph). */
export function siteOrigin(): string {
  return (
    process.env.APP_URL?.replace(/\/$/, "") || "https://app.sirrelay.com"
  );
}

export function siteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteOrigin()}${normalized === "/" ? "" : normalized}`;
}
