"use client";

import type { TransitionEvent } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { popoverStyles } from "@/components/ui/popover";
import { cn } from "@/lib/cn";
import { toastStyles } from "./toast.styles";

type ToastProps = {
  children: React.ReactNode;
  closeLabel: string;
  onClose: () => void;
  visible: boolean;
  onTransitionEnd: (event: TransitionEvent<HTMLElement>) => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
};

export function Toast({
  children,
  closeLabel,
  onClose,
  visible,
  onTransitionEnd,
  onPointerEnter,
  onPointerLeave,
}: ToastProps) {
  return (
    <div className={toastStyles.host}>
      <div
        role="status"
        className={cn(
          toastStyles.panel,
          visible ? popoverStyles.panelMotionOpen : popoverStyles.panelMotionClose,
          visible ? popoverStyles.panelOpen : popoverStyles.panelClosed,
        )}
        onTransitionEnd={onTransitionEnd}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <p className={toastStyles.message}>{children}</p>
        <button
          type="button"
          className={toastStyles.close}
          aria-label={closeLabel}
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
