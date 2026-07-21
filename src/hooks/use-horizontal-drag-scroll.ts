"use client";

import { useCallback, useEffect, useRef } from "react";

const PAN_THRESHOLD_PX = 6;

/** Block pan on form controls and marked regions (task cards, drag handle, etc.). */
const NO_PAN_SELECTOR =
  "input, textarea, select, label, [contenteditable='true'], [data-no-drag-scroll]";

function isNoPanTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(NO_PAN_SELECTOR));
}

function isHorizontalScrollbarPointer(el: HTMLElement, event: PointerEvent): boolean {
  const scrollbarHeight = el.offsetHeight - el.clientHeight;
  if (scrollbarHeight <= 0) return false;

  const rect = el.getBoundingClientRect();
  return event.clientY - rect.top >= rect.height - scrollbarHeight;
}

interface PanState {
  tracking: boolean;
  didPan: boolean;
  pointerId: number;
  startX: number;
  startY: number;
  scrollLeft: number;
}

type GlobalListeners = {
  move: (event: PointerEvent) => void;
  up: (event: PointerEvent) => void;
};

export function useHorizontalDragScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<PanState>({
    tracking: false,
    didPan: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
  });
  const listenersRef = useRef<GlobalListeners | null>(null);

  const detachGlobalListeners = useCallback(() => {
    const listeners = listenersRef.current;
    if (!listeners) return;

    document.removeEventListener("pointermove", listeners.move);
    document.removeEventListener("pointerup", listeners.up);
    document.removeEventListener("pointercancel", listeners.up);
    listenersRef.current = null;
  }, []);

  const resetScrollUi = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.style.cursor = "";
    el.removeAttribute("data-panning");
  }, []);

  const finishTracking = useCallback(
    (pointerId: number) => {
      const el = scrollRef.current;
      if (el?.hasPointerCapture(pointerId)) {
        el.releasePointerCapture(pointerId);
      }

      resetScrollUi();
      panRef.current.tracking = false;
      panRef.current.pointerId = -1;
      detachGlobalListeners();
    },
    [detachGlobalListeners, resetScrollUi],
  );

  useEffect(() => {
    return () => detachGlobalListeners();
  }, [detachGlobalListeners]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (isNoPanTarget(event.target)) return;

      const el = scrollRef.current;
      if (!el) return;

      if (isHorizontalScrollbarPointer(el, event.nativeEvent)) return;

      detachGlobalListeners();

      panRef.current = {
        tracking: true,
        didPan: false,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: el.scrollLeft,
      };

      const onMove = (moveEvent: PointerEvent) => {
        const pan = panRef.current;
        const scrollEl = scrollRef.current;
        if (!scrollEl || !pan.tracking || pan.pointerId !== moveEvent.pointerId) return;

        const dx = moveEvent.clientX - pan.startX;
        const dy = moveEvent.clientY - pan.startY;

        if (!pan.didPan) {
          if (Math.abs(dx) < PAN_THRESHOLD_PX && Math.abs(dy) < PAN_THRESHOLD_PX) return;

          if (Math.abs(dy) > Math.abs(dx)) {
            panRef.current.didPan = false;
            finishTracking(moveEvent.pointerId);
            return;
          }

          pan.didPan = true;
          scrollEl.style.cursor = "grabbing";
          scrollEl.dataset.panning = "true";
          scrollEl.setPointerCapture(moveEvent.pointerId);
        }

        scrollEl.scrollLeft = pan.scrollLeft - dx;
        moveEvent.preventDefault();
      };

      const onUp = (upEvent: PointerEvent) => {
        const wasPan = panRef.current.didPan;
        finishTracking(upEvent.pointerId);

        if (!wasPan) {
          panRef.current.didPan = false;
        }
      };

      listenersRef.current = { move: onMove, up: onUp };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    },
    [detachGlobalListeners, finishTracking],
  );

  const onClickCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!panRef.current.didPan) return;

    event.preventDefault();
    event.stopPropagation();
    panRef.current.didPan = false;
  }, []);

  return {
    scrollRef,
    scrollHandlers: {
      onPointerDown,
      onClickCapture,
    },
  };
}
