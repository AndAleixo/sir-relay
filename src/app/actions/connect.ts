"use server";

import {
  hasLinkToken,
  issueLinkToken,
  revokeLinkToken,
} from "@/lib/link-token";
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

/** Same bearer as /connect — for Profile copy into MCP / marketplace. */
export async function createLinkTokenAction(): Promise<
  { token: string } | { error: "unauthorized" }
> {
  const session = await getServices().auth.getSession();
  if (!session) return { error: "unauthorized" };
  const token = await issueLinkToken(session.user.id);
  return { token };
}

export async function revokeLinkTokenAction(): Promise<
  { ok: true; hadKey: boolean } | { error: "unauthorized" }
> {
  const session = await getServices().auth.getSession();
  if (!session) return { error: "unauthorized" };
  const hadKey = await hasLinkToken(session.user.id);
  await revokeLinkToken(session.user.id);
  return { ok: true, hadKey };
}
