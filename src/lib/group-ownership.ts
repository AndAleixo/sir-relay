/**
 * Pick next group owner among remaining members:
 * oldest operator by membership createdAt, else oldest member (any role).
 */
export function pickOwnershipSuccessorId<
  T extends { userId: string; role: "operator" | "teammate"; createdAt: Date | string | number },
>(members: T[], excludeUserId: string): string | null {
  const remaining = members.filter((m) => m.userId !== excludeUserId);
  if (remaining.length === 0) return null;

  const byAge = (a: T, b: T) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return ta - tb;
  };

  const operators = remaining.filter((m) => m.role === "operator").sort(byAge);
  if (operators[0]) return operators[0].userId;
  return [...remaining].sort(byAge)[0]?.userId ?? null;
}
