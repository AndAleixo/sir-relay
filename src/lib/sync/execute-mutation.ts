import type { PendingMutation, TaskActionResult } from "@/domain/sync";
import {
  reassignTaskAction,
  updateTaskStatusAction,
} from "@/app/actions/mock-tasks";

export async function executePendingMutation(
  mutation: PendingMutation,
): Promise<TaskActionResult> {
  try {
    const options = {
      clientMutationId: mutation.clientMutationId,
      baseUpdatedAt: mutation.baseUpdatedAt,
    };

    switch (mutation.type) {
      case "update_status": {
        const payload = mutation.payload;
        if (!("status" in payload)) {
          return { ok: false, error: "network" };
        }
        return await updateTaskStatusAction(
          mutation.taskId,
          payload.status,
          options,
        );
      }
      case "reassign": {
        const payload = mutation.payload;
        if (!("assigneeId" in payload)) {
          return { ok: false, error: "network" };
        }
        return await reassignTaskAction(
          mutation.taskId,
          payload.assigneeId,
          payload.assigneeName,
          options,
        );
      }
      default:
        return { ok: false, error: "network" };
    }
  } catch {
    return { ok: false, error: "network" };
  }
}
