"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { useDismissable } from "@/hooks/use-dismissable";
import { useFadeOpen } from "@/hooks/use-fade-open";
import { ChevronDown } from "@/components/ui/icons";
import { taskCardStyles } from "./task-card.styles";

export type TaskOpenProject = {
  id: string;
  name: string;
  acronym: string;
};

type TaskProjectPickerProps = {
  currentId: string | null;
  currentAcronym: string;
  projects: TaskOpenProject[];
  noneLabel: string;
  ariaLabel: string;
  scrollLeftLabel: string;
  scrollRightLabel: string;
  disabled?: boolean;
  children?: ReactNode;
  onPick: (projectId: string | null) => void;
};

export function TaskProjectPicker({
  currentId,
  currentAcronym,
  projects,
  noneLabel,
  ariaLabel,
  scrollLeftLabel,
  scrollRightLabel,
  disabled,
  children,
  onPick,
}: TaskProjectPickerProps) {
  const [open, setOpen] = useState(false);
  const { rendered, visible, onTransitionEnd } = useFadeOpen(open);
  const rootRef = useRef<HTMLDivElement>(null);
  const prefixRef = useRef<HTMLSpanElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [stripWidth, setStripWidth] = useState<number | null>(null);

  const dismiss = useCallback(() => setOpen(false), []);
  useDismissable(open, dismiss, rootRef);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  const measure = useCallback(() => {
    const root = rootRef.current;
    const prefix = prefixRef.current;
    const row = rowRef.current;
    if (!root || !prefix) return;
    const remaining = Math.max(0, root.clientWidth - prefix.offsetWidth);
    const content = row?.scrollWidth ?? 0;
    setStripWidth(content > remaining ? remaining : null);
  }, []);

  useLayoutEffect(() => {
    if (!rendered) return;
    measure();
  }, [rendered, visible, projects.length, measure]);

  useLayoutEffect(() => {
    if (!rendered) return;
    updateArrows();
  }, [rendered, stripWidth, updateArrows]);

  useEffect(() => {
    if (!rendered) return;
    const root = rootRef.current;
    const observer = root ? new ResizeObserver(measure) : null;
    if (root) observer?.observe(root);
    const scroller = scrollerRef.current;
    scroller?.addEventListener("scroll", updateArrows);
    return () => {
      observer?.disconnect();
      scroller?.removeEventListener("scroll", updateArrows);
    };
  }, [rendered, measure, updateArrows]);

  const options: { value: string; label: string; hint?: string }[] = [
    { value: "", label: noneLabel },
    ...(currentId && !projects.some((row) => row.id === currentId)
      ? [{ value: currentId, label: currentAcronym }]
      : []),
    ...projects.map((row) => ({
      value: row.id,
      label: row.acronym,
      hint: row.name,
    })),
  ];

  function scroll(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.75, 40) });
  }

  const stretched = stripWidth != null;

  return (
    <div
      ref={rootRef}
      className={
        children
          ? taskCardStyles.projectPickerShell
          : taskCardStyles.projectPickerHug
      }
    >
      <span ref={prefixRef} className={taskCardStyles.acronymRoot}>
        <button
          type="button"
          className={cn(
            taskCardStyles.acronymButton,
            open && taskCardStyles.menuButtonOpen,
          )}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={rendered ? menuId : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          {currentAcronym}
        </button>
        <span className={taskCardStyles.acronymSep}>·</span>
        {rendered ? (
          <div
            id={menuId}
            role="menu"
            className={cn(
              taskCardStyles.projectSegment,
              stretched
                ? taskCardStyles.projectSegmentStretch
                : taskCardStyles.projectSegmentHug,
              visible
                ? taskCardStyles.overlayOpen
                : taskCardStyles.projectSegmentClosed,
            )}
            style={{ width: stripWidth ?? undefined }}
            onTransitionEnd={onTransitionEnd}
          >
            {stretched && canScrollLeft ? (
              <button
                type="button"
                className={cn(
                  taskCardStyles.projectScrollArrow,
                  taskCardStyles.projectScrollArrowLeft,
                )}
                aria-label={scrollLeftLabel}
                onClick={() => scroll(-1)}
              >
                <ChevronDown className="rotate-90" />
              </button>
            ) : null}
            <div ref={scrollerRef} className={taskCardStyles.projectScroller}>
              <div ref={rowRef} className={taskCardStyles.projectScrollerRow}>
                {options.map((option) => {
                  const active = option.value === (currentId ?? "");
                  return (
                    <button
                      key={option.value || "none"}
                      type="button"
                      role="menuitem"
                      tabIndex={visible ? 0 : -1}
                      className={cn(
                        taskCardStyles.menuItem,
                        taskCardStyles.projectMenuItem,
                        active && taskCardStyles.menuButtonOpen,
                      )}
                      title={option.hint}
                      disabled={disabled}
                      onClick={() => {
                        const next = option.value || null;
                        setOpen(false);
                        if (next !== (currentId ?? null)) onPick(next);
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {stretched && canScrollRight ? (
              <button
                type="button"
                className={cn(
                  taskCardStyles.projectScrollArrow,
                  taskCardStyles.projectScrollArrowRight,
                )}
                aria-label={scrollRightLabel}
                onClick={() => scroll(1)}
              >
                <ChevronDown className="-rotate-90" />
              </button>
            ) : null}
          </div>
        ) : null}
      </span>
      {children ? (
        <span
          className={cn(
            taskCardStyles.overlayFade,
            rendered && taskCardStyles.overlayFaded,
          )}
        >
          {children}
        </span>
      ) : null}
    </div>
  );
}
