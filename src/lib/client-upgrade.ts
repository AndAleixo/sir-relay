import { NextResponse } from "next/server";

/**
 * Retired-client / future min-version gate.
 *
 * Contract: HTTP 410 + `{ error: "upgrade_required", message, minClient? }`.
 * Clients must prefer `message` from the body. Advertise identity via
 * `X-SirRelay-Client: extension|mcp/<semver>` so a later gate can compare
 * against `minClient` or env without changing the status/error code.
 */
export const CLIENT_UPGRADE_MESSAGE =
  "This SRelay client is out of date. Update to the latest extension or @sirrelay/mcp, then create a new API key at /connect.";

export type UpgradeRequiredBody = {
  error: "upgrade_required";
  message: string;
  /** Optional SemVer floor for future gates (clients may ignore today). */
  minClient?: string;
};

export function upgradeRequiredResponse(opts?: {
  minClient?: string;
  message?: string;
}): NextResponse {
  const body: UpgradeRequiredBody = {
    error: "upgrade_required",
    message: opts?.message?.trim() || CLIENT_UPGRADE_MESSAGE,
  };
  if (opts?.minClient?.trim()) body.minClient = opts.minClient.trim();
  return NextResponse.json(body, { status: 410 });
}
