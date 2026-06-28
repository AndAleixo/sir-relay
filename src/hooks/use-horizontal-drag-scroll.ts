"use client";

import { useCallback, useRef } from "react";

const PAN_THRESHOLD_PX = 6;

const NO_PAN_SELECTOR =
  "button, input, textarea, select, label, [contenteditable='true'], [data-no-drag-scroll]";

function isNoPanTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(NO_PAN_SELECTOR));
}

interface PanState {
  tracking: boolean;
  didPan: boolean;
  pointerId: number;
  startX: number;
  startY: number;
  scrollLeft: number;
}

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

  const releasePointer = useCallback((pointerId: number) => {
    const el = scrollRef.current;
    if (!el?.hasPointerCapture(pointerId)) return;

    el.releasePointerCapture(pointerId);
    el.style.cursor = "";
    panRef.current.tracking = false;
    panRef.current.pointerId = -1;
  }, []);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (isNoPanTarget(event.target)) return;

    const el = scrollRef.current;
    if (!el) return;

    panRef.current = {
      tracking: true,
      didPan: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: el.scrollLeft,
    };

    el.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const pan = panRef.current;
    if (!el || !pan.tracking || pan.pointerId !== event.pointerId) return;

    const dx = event.clientX - pan.startX;
    const dy = event.clientY - pan.startY;

    if (!pan.didPan) {
      if (Math.abs(dx) < PAN_THRESHOLD_PX && Math.abs(dy) < PAN_THRESHOLD_PX) return;

      if (Math.abs(dy) > Math.abs(dx)) {
        releasePointer(event.pointerId);
        return;
      }

      pan.didPan = true;
      el.style.cursor = "grabbing";
    }

    el.scrollLeft = pan.scrollLeft - dx;
    event.preventDefault();
  }, [releasePointer]);

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      releasePointer(event.pointerId);
    },
    [releasePointer],
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      panRef.current.didPan = false;
      releasePointer(event.pointerId);
    },
    [releasePointer],
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
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onClickCapture,
    },
  };
}
