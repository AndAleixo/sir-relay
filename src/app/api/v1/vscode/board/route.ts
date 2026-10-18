import { NextResponse } from "next/server";
import { buildVsCodeBoard } from "@/lib/vscode-board";
import { sessionFromVsCodeRequest } from "@/lib/vscode-link";

export async function GET(request: Request) {
  const groupId = new URL(request.url).searchParams.get("groupId");
  const session = await sessionFromVsCodeRequest(request, groupId);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const board = await buildVsCodeBoard(session);
  return NextResponse.json(board);
}
