"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import {
  clearTaskDragData,
  getActiveDragTaskId,
  getTaskIdFromDragEvent,
} from "@/lib/task-drag";

const EDGE_PX = 40;
const SCROLL_STEP = 14;

function autoScrollNearest(el: HTMLElement | null, clientY: number): boolean {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  if (clientY < rect.top + EDGE_PX) {
    el.scrollTop -= SCROLL_STEP;
    return true;
  }
  if (clientY > rect.bottom - EDGE_PX) {
    el.scrollTop += SCROLL_STEP;
    return true;
  }
  return false;
}

function todoCards(listEl: HTMLElement, excludeTaskId: string | null) {
  return Array.from(
    listEl.querySelectorAll<HTMLElement>("[data-todo-card]"),
  ).filter((el) => el.dataset.todoCard !== excludeTaskId);
}

/** Insert index among other cards (excludes the dragged id from hit-test). */
export function insertIndexFromClientY(
  listEl: HTMLElement,
  clientY: number,
  excludeTaskId: string | null,
): number {
  const cards = todoCards(listEl, excludeTaskId);
  for (let i = 0; i < cards.length; i++) {
    const rect = cards[i].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) return i;
  }
  return cards.length;
}

/**
 * Drop on the cards scroll area → insert index from Y.
 * Drop outside that area (section header / hint / footer) → append.
 */
export function resolveTodoDropIndex(
  event: Pick<DragEvent, "target" | "clientY">,
  excludeTaskId: string | null,
  appendIndex: number,
): number {
  const target = event.target;
  if (!(target instanceof Element)) return appendIndex;
  const scroll = target.closest("[data-todo-scroll]");
  if (!scroll) return appendIndex;
  const list =
    scroll.querySelector<HTMLElement>("[data-todo-reorder-list]") ??
    (scroll instanceof HTMLElement ? scroll : null);
  if (!list) return appendIndex;
  return insertIndexFromClientY(list, event.clientY, excludeTaskId);
}

/** Absolute drop line in content coords — must not reflow the list. */
function dropLineTop(
  listEl: HTMLElement,
  insertIndex: number,
  excludeTaskId: string | null,
): number {
  const cards = todoCards(listEl, excludeTaskId);
  if (cards.length === 0) return 4;
  if (insertIndex >= cards.length) {
    const last = cards[cards.length - 1];
    return last.offsetTop + last.offsetHeight + 4;
  }
  return Math.max(0, cards[insertIndex].offsetTop - 4);
}

/**
 * To do list reorder: keep the drag source in-flow (collapsing it cancels HTML5 DnD),
 * absolute drop line (no gap reflow while scrolling), rAF edge scroll while hovered.
 */
export function TodoReorderList({
  draggingTaskId,
  items,
  onPlace,
  className,
}: {
  draggingTaskId: string | null;
  items: { id: string; node: ReactNode }[];
  onPlace: (taskId: string, toIndex: number) => void;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const pointerYRef = useRef<number | null>(null);
  const hoveringRef = useRef(false);
  const [lineTop, setLineTop] = useState<number | null>(null);

  const clearHover = useCallback(() => {
    hoveringRef.current = false;
    pointerYRef.current = null;
    setLineTop(null);
  }, []);

  const syncInsertAt = useCallback(
    (clientY: number, excludeTaskId: string | null) => {
      const listEl = listRef.current;
      if (!listEl) return;
      const index = insertIndexFromClientY(listEl, clientY, excludeTaskId);
      setLineTop(dropLineTop(listEl, index, excludeTaskId));
    },
    [],
  );

  useEffect(() => {
    if (!draggingTaskId) clearHover();
  }, [draggingTaskId, clearHover]);

  useEffect(() => {
    if (!draggingTaskId) return;

    let raf = 0;
    const tick = () => {
      const y = pointerYRef.current;
      const listEl = listRef.current;
      if (hoveringRef.current && y != null && listEl) {
        const scrollParent =
          listEl.closest<HTMLElement>("[data-todo-scroll]") ?? listEl;
        if (autoScrollNearest(scrollParent, y)) {
          syncInsertAt(y, draggingTaskId);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [draggingTaskId, syncInsertAt]);

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "move";

      const listEl = listRef.current;
      if (!listEl) return;

      const activeId = draggingTaskId ?? getActiveDragTaskId();
      hoveringRef.current = true;
      pointerYRef.current = event.clientY;

      if (!activeId) {
        setLineTop(null);
        return;
      }

      const scrollParent =
        listEl.closest<HTMLElement>("[data-todo-scroll]") ?? listEl;
      autoScrollNearest(scrollParent, event.clientY);
      syncInsertAt(event.clientY, activeId);
    },
    [draggingTaskId, syncInsertAt],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const listEl = listRef.current;
      const draggedId = getTaskIdFromDragEvent(event);
      const index =
        listEl && draggedId
          ? insertIndexFromClientY(listEl, event.clientY, draggedId)
          : 0;

      clearHover();
      clearTaskDragData();
      if (!draggedId) return;
      onPlace(draggedId, index);
    },
    [clearHover, onPlace],
  );

  const activeId = draggingTaskId ?? getActiveDragTaskId();
  const showLine = activeId != null && lineTop != null;

  return (
    <div
      ref={listRef}
      data-todo-reorder-list=""
      className={cn(
        "relative flex h-full min-h-[2.5rem] flex-col gap-1.5",
        className,
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={(event) => {
        if (!listRef.current?.contains(event.relatedTarget as Node)) {
          clearHover();
        }
      }}
    >
      {showLine ? (
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 z-10 h-1 rounded-full bg-brand-accent"
          style={{ top: lineTop }}
        />
      ) : null}
      {items.map((item) => {
        const isSource = item.id === activeId;
        return (
          <div
            key={item.id}
            data-todo-card={item.id}
            className={cn(isSource && "opacity-40")}
          >
            {item.node}
          </div>
        );
      })}
    </div>
  );
}
