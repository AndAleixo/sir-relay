"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { taskCardStyles } from "./task-card.styles";

type TaskCardMenuProps = {
  href: string;
  menuLabel: string;
  openLabel: string;
  cloneLabel: string;
  deleteLabel: string;
  deleteConfirm: string;
  /** When false, only Open is shown (read-only columns). */
  canMutate: boolean;
  disabled?: boolean;
  onClone: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
};

const CLOSE_MS = 150;

export function TaskCardMenu({
  href,
  menuLabel,
  openLabel,
  cloneLabel,
  deleteLabel,
  deleteConfirm,
  canMutate,
  disabled,
  onClone,
  onDelete,
}: TaskCardMenuProps) {
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (open) {
      setRendered(true);
      setVisible(false);
      // Double rAF so the closed style paints before fading in.
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
    const timer = window.setTimeout(() => setRendered(false), CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

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
      {rendered ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            taskCardStyles.menuSegment,
            visible
              ? taskCardStyles.menuSegmentOpen
              : taskCardStyles.menuSegmentClosed,
          )}
        >
          <Link
            href={href}
            role="menuitem"
            tabIndex={visible ? 0 : -1}
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
                tabIndex={visible ? 0 : -1}
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
                tabIndex={visible ? 0 : -1}
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
      <button
        type="button"
        className={cn(
          taskCardStyles.menuButton,
          open && taskCardStyles.menuButtonOpen,
        )}
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={rendered ? menuId : undefined}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        ⋯
      </button>
    </div>
  );
}
