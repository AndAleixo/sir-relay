import { NextResponse } from "next/server";

/** HTTP 410 + `{ error: "upgrade_required", message, minClient? }`. Prefer body `message`. */
export const CLIENT_UPGRADE_MESSAGE =
  "This SRelay client is out of date. Update it.";

export type UpgradeRequiredBody = {
  error: "upgrade_required";
  message: string;
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
