import type { DragEvent } from "react";

export const TASK_DRAG_MIME = "application/x-sirrelay-task-id";

export function setTaskDragData(event: DragEvent, taskId: string) {
  event.dataTransfer.setData(TASK_DRAG_MIME, taskId);
  event.dataTransfer.setData("text/plain", taskId);
  event.dataTransfer.effectAllowed = "move";
}

export function getTaskIdFromDragEvent(event: DragEvent): string | null {
  const id =
    event.dataTransfer.getData(TASK_DRAG_MIME) ||
    event.dataTransfer.getData("text/plain");
  return id || null;
}

export function dropTargetKey(teammateId: string, status: string) {
  return `${teammateId}:${status}`;
}
