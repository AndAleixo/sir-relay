"use client";

import { useEffect } from "react";
import { stripSuccessFlash } from "@/lib/flash-url";

/**
 * ponytail: success flash stays on screen (RSC banner) but leaves the URL so F5
 * does not replay it. Do not auto-hide — future toast/popup will own dismissal.
 */
export function ConsumeFlash() {
  useEffect(() => {
    const next = stripSuccessFlash(window.location.search);
    if (next === null) return;
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + next,
    );
  }, []);
  return null;
}
