import { NextResponse } from "next/server";
import type { TaskStatus } from "@/domain/types";
import { sessionFromClientRequest } from "@/lib/link-token";
import { parseTaskDifficulty } from "@/lib/task-difficulty";
import { getServices } from "@/services";

const STATUSES = new Set<TaskStatus>(["todo", "doing", "done"]);

function optionalId(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  return String(raw);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const session = await sessionFromClientRequest(
    request,
    String(body.groupId ?? "") || null,
  );
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const tasks = getServices().tasks;
  try {
    if (body.op === "status" && STATUSES.has(body.status as TaskStatus)) {
      await tasks.updateTaskStatus(id, body.status as TaskStatus, { session });
    } else if (body.op === "title") {
      const title = String(body.title ?? "").trim();
      if (!title) return NextResponse.json({ error: "title" }, { status: 400 });
      await tasks.updateTaskFields(id, { title }, { session });
    } else if (body.op === "description") {
      await tasks.updateTaskFields(
        id,
        { description: String(body.description ?? "") },
        { session },
      );
    } else if (body.op === "dueDate") {
      const dueDate =
        body.dueDate == null || body.dueDate === ""
          ? null
          : String(body.dueDate).trim() || null;
      await tasks.updateTaskFields(id, { dueDate }, { session });
    } else if (body.op === "difficulty") {
      const raw = body.difficulty;
      if (raw != null && raw !== "" && parseTaskDifficulty(raw) === null) {
        return NextResponse.json({ error: "difficulty" }, { status: 400 });
      }
      await tasks.updateTaskFields(
        id,
        { difficulty: parseTaskDifficulty(raw) },
        { session },
      );
    } else if (body.op === "project") {
      await tasks.updateTaskFields(
        id,
        { projectId: optionalId(body.projectId) },
        { session },
      );
    } else if (body.op === "category") {
      await tasks.updateTaskFields(
        id,
        { categoryId: optionalId(body.categoryId) },
        { session },
      );
    } else if (body.op === "reorder" && Array.isArray(body.orderedTodoIds)) {
      const orderedTodoIds = body.orderedTodoIds.map((item) => String(item));
      await tasks.placeInTodoQueue(id, session.user.id, orderedTodoIds, { session });
    } else if (body.op === "clone") {
      await tasks.cloneTask(id, { session });
    } else if (body.op === "delete") {
      await tasks.deleteTask(id, { session });
    } else {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    const error = message === "Forbidden" ? "forbidden" : "failed";
    return NextResponse.json({ error }, { status: error === "forbidden" ? 403 : 400 });
  }
}
