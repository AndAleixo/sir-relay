"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  defaultLocale,
  localeCompactLabels,
  localeNames,
  locales,
  type AppLocale,
} from "@/i18n/config";
import { cn } from "@/lib/cn";
import { shellStyles } from "./app-shell.styles";

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 shrink-0", className)}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

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
  const rootRef = useRef<HTMLDivElement>(null);
  const current = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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
        <Chevron className={open ? "rotate-180" : undefined} />
      </button>

      {open ? (
        <ul
          className={cn(
            shellStyles.localePickerPanel,
            fullWidth && shellStyles.localePickerPanelFull,
          )}
          role="listbox"
          aria-label={t("language")}
        >
          {locales.map((loc) => {
            const active = loc === current;
            return (
              <li key={loc} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    shellStyles.localePickerItem,
                    active && shellStyles.localePickerItemActive,
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
