import { NextResponse } from "next/server";
import { buildClientBoard } from "@/lib/client-board";
import { sessionFromClientRequest } from "@/lib/link-token";

export async function GET(request: Request) {
  const groupId = new URL(request.url).searchParams.get("groupId");
  const session = await sessionFromClientRequest(request, groupId);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const board = await buildClientBoard(session);
  return NextResponse.json(board);
}
