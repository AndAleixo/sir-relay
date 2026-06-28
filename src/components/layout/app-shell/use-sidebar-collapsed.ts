"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sirrelay:sidebar-collapsed";

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      /* private mode */
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  }, []);

  return { collapsed, toggle };
}
