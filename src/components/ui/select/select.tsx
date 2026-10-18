"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useDismissable } from "@/hooks/use-dismissable";
import { useFadeOpen } from "@/hooks/use-fade-open";
import { CheckIcon, ChevronDown } from "@/components/ui/icons";
import { popoverStyles } from "@/components/ui/popover";

export type SelectOption = {
  value: string;
  label: string;
  /** Closed-trigger text below md (or always when `compactTrigger`). */
  compactLabel?: string;
};

type SelectProps = {
  id?: string;
  name?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  "aria-label"?: string;
  /** Use `compactLabel` on the closed trigger at every width (toolbar filters). */
  compactTrigger?: boolean;
};

export function Select({
  id,
  name,
  options,
  value: valueProp,
  defaultValue,
  onChange,
  required,
  disabled,
  className,
  triggerClassName,
  "aria-label": ariaLabel,
  compactTrigger = false,
}: SelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { rendered, visible, onTransitionEnd } = useFadeOpen(open);
  const [uncontrolled, setUncontrolled] = useState(
    () => defaultValue ?? options[0]?.value ?? "",
  );
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : uncontrolled;
  const selected = options.find((option) => option.value === value);
  const selectedLabel = selected?.label ?? value;
  const compactLabel = selected?.compactLabel;

  useDismissable(open, () => setOpen(false), rootRef);

  function pick(next: string) {
    if (!controlled) setUncontrolled(next);
    onChange?.(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {name ? (
        <input type="hidden" name={name} value={value} required={required} />
      ) : null}
      <button
        type="button"
        id={id}
        className={cn(popoverStyles.trigger, triggerClassName)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={rendered ? listId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="min-w-0 truncate">
          {compactLabel ? (
            compactTrigger ? (
              compactLabel
            ) : (
              <>
                <span className="md:hidden">{compactLabel}</span>
                <span className="hidden md:inline">{selectedLabel}</span>
              </>
            )
          ) : (
            selectedLabel
          )}
        </span>
        <ChevronDown className={open ? "rotate-180" : undefined} />
      </button>
      {rendered ? (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            popoverStyles.panel,
            popoverStyles.panelSelect,
            visible
              ? popoverStyles.panelMotionOpen
              : popoverStyles.panelMotionClose,
            visible ? popoverStyles.panelOpen : popoverStyles.panelClosed,
          )}
          onTransitionEnd={onTransitionEnd}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  tabIndex={visible ? 0 : -1}
                  className={cn(
                    popoverStyles.item,
                    "justify-between gap-2",
                    active && popoverStyles.itemActive,
                  )}
                  onClick={() => pick(option.value)}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {active ? <CheckIcon /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
