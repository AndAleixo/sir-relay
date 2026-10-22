import { NextResponse } from "next/server";
import { createInputFromBody } from "@/lib/client-board";
import { sessionFromClientRequest } from "@/lib/link-token";
import { getServices } from "@/services";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const session = await sessionFromClientRequest(
    request,
    String(body.groupId ?? "") || null,
  );
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const input = createInputFromBody(body, session.user.id);
  if (!input.title) return NextResponse.json({ error: "title" }, { status: 400 });

  try {
    const task = await getServices().tasks.createTask(input, { session });
    return NextResponse.json({
      ok: true,
      away: task.assigneeId !== session.user.id,
      assigneeName: task.assigneeName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    const error = message === "Forbidden" ? "forbidden" : "failed";
    return NextResponse.json({ error }, { status: error === "forbidden" ? 403 : 400 });
  }
}
