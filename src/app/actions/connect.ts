"use server";

import { issueLinkToken } from "@/lib/link-token";
import { editorUriScheme } from "@/lib/connect-next";
import { getServices } from "@/services";

export async function connectClient(
  schemeRaw: string,
): Promise<{ token: string; uri: string } | { error: "unauthorized" }> {
  const session = await getServices().auth.getSession();
  if (!session) return { error: "unauthorized" };
  const scheme = editorUriScheme(schemeRaw);
  const token = await issueLinkToken(session.user.id);
  const uri = `${scheme}://sirrelay.sirrelay/connect?token=${encodeURIComponent(token)}`;
  return { token, uri };
}
