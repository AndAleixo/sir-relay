"use server";

import { issueVsCodeToken } from "@/lib/vscode-link";
import { vsCodeScheme } from "@/lib/vscode-next";
import { getServices } from "@/services";

export async function connectVsCode(
  schemeRaw: string,
): Promise<{ token: string; uri: string } | { error: "unauthorized" }> {
  const session = await getServices().auth.getSession();
  if (!session) return { error: "unauthorized" };
  const scheme = vsCodeScheme(schemeRaw);
  const token = await issueVsCodeToken(session.user.id);
  const uri = `${scheme}://sirrelay.sirrelay/connect?token=${encodeURIComponent(token)}`;
  return { token, uri };
}
