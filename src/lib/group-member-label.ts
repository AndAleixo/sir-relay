/** Group UI label: fantasy name → account name → email (pending invites). */
export function groupMemberLabel(user: {
  name: string;
  email: string;
  displayName?: string | null;
}): string {
  const fantasy = user.displayName?.trim();
  if (fantasy) return fantasy;
  const account = user.name.trim();
  if (account) return account;
  return user.email;
}
