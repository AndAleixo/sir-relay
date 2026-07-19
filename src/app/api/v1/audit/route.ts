import { NextResponse } from "next/server";
import { listAuditForGroup } from "@/lib/audit";
import { getServices } from "@/services";

export const dynamic = "force-dynamic";

/** P2-AUD-04 — raw audit list (platform/admin later). Operator UI uses /events/activity. */
export async function GET(request: Request) {
  const session = await getServices().auth.getSession();
  if (!session?.activeGroupId || session.user.role !== "operator") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "30");
  const result = await listAuditForGroup(session.activeGroupId, { page, pageSize });
  return NextResponse.json(result);
}
