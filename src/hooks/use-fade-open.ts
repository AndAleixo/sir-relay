"use client";

import { useCallback, useEffect, useState, type TransitionEvent } from "react";

/** Open fade duration — pair with `duration-200` when visible. */
export const FADE_OPEN_MS = 200;

/** Close fade duration — slightly longer so exit is noticeable; pair with `duration-300`. */
export const FADE_CLOSE_MS = 300;

/**
 * Mount → paint closed → fade in; on close fade out then unmount after FADE_CLOSE_MS
 * (or earlier via onTransitionEnd).
 */
export function useFadeOpen(open: boolean): {
  rendered: boolean;
  visible: boolean;
  onTransitionEnd: (event: TransitionEvent<HTMLElement>) => void;
} {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setVisible(false);
      let inner = 0;
      const outer = window.requestAnimationFrame(() => {
        inner = window.requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        window.cancelAnimationFrame(outer);
        window.cancelAnimationFrame(inner);
      };
    }

    setVisible(false);
    const timer = window.setTimeout(() => setRendered(false), FADE_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  const onTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLElement>) => {
      if (event.propertyName !== "opacity") return;
      if (event.target !== event.currentTarget) return;
      if (!open) setRendered(false);
    },
    [open],
  );

  return { rendered, visible, onTransitionEnd };
}
