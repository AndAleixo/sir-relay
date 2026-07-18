import type { DragEvent } from "react";

export const TASK_DRAG_MIME = "application/x-sirrelay-task-id";

/** Fallback when browsers clear dataTransfer mid-drag (common with button handles). */
let activeDragTaskId: string | null = null;

export function setTaskDragData(event: DragEvent, taskId: string) {
  activeDragTaskId = taskId;
  event.dataTransfer.setData(TASK_DRAG_MIME, taskId);
  event.dataTransfer.setData("text/plain", taskId);
  event.dataTransfer.effectAllowed = "move";
}

export function clearTaskDragData() {
  activeDragTaskId = null;
}

export function getTaskIdFromDragEvent(event: DragEvent): string | null {
  const id =
    event.dataTransfer.getData(TASK_DRAG_MIME) ||
    event.dataTransfer.getData("text/plain") ||
    activeDragTaskId;
  return id || null;
}

export function getActiveDragTaskId(): string | null {
  return activeDragTaskId;
}

export function dropTargetKey(teammateId: string, status: string) {
  return `${teammateId}:${status}`;
}
