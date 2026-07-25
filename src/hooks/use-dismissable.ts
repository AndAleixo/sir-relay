"use client";

import { useEffect, type RefObject } from "react";

/**
 * Close on outside pointerdown / Escape while `open`.
 * `extraRef` for portaled panels (e.g. group switcher mobile).
 */
export function useDismissable(
  open: boolean,
  onDismiss: () => void,
  rootRef: RefObject<HTMLElement | null>,
  extraRef?: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (extraRef?.current?.contains(target)) return;
      onDismiss();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onDismiss, rootRef, extraRef]);
}
