/** True when `pathname` matches a primary nav route (includes sub-routes). */
export function isPrimaryNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Sections that sit under a demo home and must not keep that home active. */
const DEMO_SECTIONS = new Set(["teammates", "projects", "events", "profile"]);

/**
 * Like `isPrimaryNavActive`, but a demo home (`/demo/app`) stays inactive
 * on sibling screens that share its prefix.
 */
export function isNavItemActive(
  pathname: string,
  href: string,
  homeHref?: string,
): boolean {
  if (!homeHref || href !== homeHref) return isPrimaryNavActive(pathname, href);
  if (pathname === href || pathname === `${href}/`) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  const section = pathname.slice(href.length + 1).split("/")[0] ?? "";
  return !DEMO_SECTIONS.has(section);
}
