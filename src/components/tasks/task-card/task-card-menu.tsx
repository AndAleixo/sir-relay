"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { taskCardStyles } from "./task-card.styles";

type TaskCardMenuProps = {
  href: string;
  openLabel: string;
  cloneLabel: string;
  deleteLabel: string;
  menuLabel: string;
  deleteConfirm: string;
  /** When false, only Open is shown (read-only columns). */
  canMutate: boolean;
  disabled?: boolean;
  onClone: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
};

export function TaskCardMenu({
  href,
  openLabel,
  cloneLabel,
  deleteLabel,
  menuLabel,
  deleteConfirm,
  canMutate,
  disabled,
  onClone,
  onDelete,
}: TaskCardMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={taskCardStyles.menuRoot}>
      <button
        type="button"
        className={cn(
          taskCardStyles.menuButton,
          open && taskCardStyles.menuButtonOpen,
        )}
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        ⋯
      </button>
      {open ? (
        <div id={menuId} role="menu" className={taskCardStyles.menuPanel}>
          <Link
            href={href}
            role="menuitem"
            className={taskCardStyles.menuItem}
            onClick={() => setOpen(false)}
          >
            {openLabel}
          </Link>
          {canMutate ? (
            <>
              <button
                type="button"
                role="menuitem"
                className={taskCardStyles.menuItem}
                disabled={disabled}
                onClick={() => {
                  setOpen(false);
                  void onClone();
                }}
              >
                {cloneLabel}
              </button>
              <button
                type="button"
                role="menuitem"
                className={cn(
                  taskCardStyles.menuItem,
                  taskCardStyles.menuItemDanger,
                )}
                disabled={disabled}
                onClick={() => {
                  if (!window.confirm(deleteConfirm)) return;
                  setOpen(false);
                  void onDelete();
                }}
              >
                {deleteLabel}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
