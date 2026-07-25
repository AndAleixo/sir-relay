"use client";

import Link from "next/link";
import { useCallback, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useDismissable } from "@/hooks/use-dismissable";
import { useFadeOpen } from "@/hooks/use-fade-open";
import { taskCardStyles } from "./task-card.styles";

type TaskCardMenuProps = {
  href: string;
  taskMenu: string;
  menuOpen: string;
  menuClone: string;
  menuDelete: string;
  deleteConfirm: string;
  /** When false, only Open is shown (read-only columns). */
  canMutate: boolean;
  disabled?: boolean;
  onClone: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
};

export function TaskCardMenu({
  href,
  taskMenu,
  menuOpen,
  menuClone,
  menuDelete,
  deleteConfirm,
  canMutate,
  disabled,
  onClone,
  onDelete,
}: TaskCardMenuProps) {
  const [open, setOpen] = useState(false);
  const { rendered, visible, onTransitionEnd } = useFadeOpen(open);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const dismiss = useCallback(() => setOpen(false), []);
  useDismissable(open, dismiss, rootRef);

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
          onTransitionEnd={onTransitionEnd}
        >
          <Link
            href={href}
            role="menuitem"
            tabIndex={visible ? 0 : -1}
            className={taskCardStyles.menuItem}
            onClick={() => setOpen(false)}
          >
            {menuOpen}
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
                {menuClone}
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
                {menuDelete}
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
        aria-label={taskMenu}
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
