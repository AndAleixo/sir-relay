/** Extract invite token from a pasted link or raw code. */
export function parseInviteToken(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const fromUrl = trimmed.match(/\/join\/([^/?#]+)/)?.[1];
  const token = fromUrl ?? trimmed;
  return token.length >= 8 ? token : null;
}
