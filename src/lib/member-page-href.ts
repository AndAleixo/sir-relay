/** Operator, including their own row → member detail. Teammate opening self → Settings. */
export function memberPageHref(
  locale: string,
  memberId: string,
  opts: { self: boolean; operator: boolean },
): string {
  if (opts.self && !opts.operator) return `/${locale}/settings`;
  return `/${locale}/teammates/${memberId}`;
}
