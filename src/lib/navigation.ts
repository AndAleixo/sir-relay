/** True when `pathname` matches a primary nav route (includes sub-routes). */
export function isPrimaryNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
