"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  defaultLocale,
  localeCompactLabels,
  localeNames,
  locales,
  type AppLocale,
} from "@/i18n/config";
import { cn } from "@/lib/cn";
import { useDismissable } from "@/hooks/use-dismissable";
import { useFadeOpen } from "@/hooks/use-fade-open";
import { CheckIcon, ChevronDown } from "@/components/ui/icons";
import { popoverStyles } from "@/components/ui/popover";
import { shellStyles } from "./app-shell.styles";

interface LocalePickerProps {
  locale: string;
  compact?: boolean;
  fullWidth?: boolean;
  onSelect: (locale: AppLocale) => void;
}

export function LocalePicker({
  locale,
  compact = false,
  fullWidth = false,
  onSelect,
}: LocalePickerProps) {
  const t = useTranslations("profile");
  const [open, setOpen] = useState(false);
  const { rendered, visible, onTransitionEnd } = useFadeOpen(open);
  const rootRef = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => setOpen(false), []);
  useDismissable(open, dismiss, rootRef);
  const current = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;

  function pick(next: AppLocale) {
    setOpen(false);
    if (next !== current) onSelect(next);
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        shellStyles.localePickerRoot,
        fullWidth && shellStyles.localePickerRootFull,
      )}
    >
      <button
        type="button"
        className={cn(
          shellStyles.headerControl,
          shellStyles.localePickerTrigger,
          compact && shellStyles.localePickerTriggerCompact,
          fullWidth && shellStyles.localePickerTriggerFull,
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("language")}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={shellStyles.localePickerLabel}>
          {compact ? localeCompactLabels[current] : localeNames[current]}
        </span>
        <ChevronDown className={open ? "rotate-180" : undefined} />
      </button>

      {rendered ? (
        <ul
          className={cn(
            popoverStyles.panel,
            popoverStyles.panelDropdown,
            shellStyles.localePickerPanelWidth,
            fullWidth && shellStyles.localePickerPanelFull,
            visible
              ? popoverStyles.panelMotionOpen
              : popoverStyles.panelMotionClose,
            visible ? popoverStyles.panelOpen : popoverStyles.panelClosed,
          )}
          role="listbox"
          aria-label={t("language")}
          onTransitionEnd={onTransitionEnd}
        >
          {locales.map((loc) => {
            const active = loc === current;
            return (
              <li key={loc} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  tabIndex={visible ? 0 : -1}
                  className={cn(
                    popoverStyles.item,
                    shellStyles.localePickerItem,
                    active && popoverStyles.itemActive,
                  )}
                  onClick={() => pick(loc)}
                >
                  <span className={shellStyles.localePickerItemMain}>
                    <span className="truncate">{localeNames[loc]}</span>
                  </span>
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
