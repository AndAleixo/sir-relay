"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  defaultLocale,
  localeNames,
  localeShortLabels,
  locales,
  withLocale,
  type AppLocale,
} from "@/i18n/config";
import { cn } from "@/lib/cn";
import { useDismissable } from "@/hooks/use-dismissable";
import { useFadeOpen } from "@/hooks/use-fade-open";
import { CheckIcon, ChevronDown } from "@/components/ui/icons";
import { popoverStyles } from "@/components/ui/popover";
import { shellStyles } from "@/components/layout/app-shell/app-shell.styles";

const segment = {
  nav: "shrink-0",
  group:
    "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-bg)] p-0.5 shadow-sm",
  item: "min-w-[1.75rem] rounded-full px-1.5 py-1 text-center text-[11px] font-medium tracking-wide text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent sm:min-w-[2.75rem] sm:px-3 sm:py-1.5 sm:text-xs",
  itemActive:
    "min-w-[1.75rem] rounded-full bg-surface-card px-1.5 py-1 text-center text-[11px] font-semibold tracking-wide text-[var(--text-primary)] shadow-sm ring-1 ring-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent sm:min-w-[2.75rem] sm:px-3 sm:py-1.5 sm:text-xs",
} as const;

type LocaleSwitcherSegmentProps = {
  variant: "segment";
  locale: string;
  className?: string;
};

type LocaleSwitcherMenuProps = {
  variant: "menu";
  locale: string;
  compact?: boolean;
  fullWidth?: boolean;
  onSelect: (locale: AppLocale) => void;
};

export type LocaleSwitcherProps = LocaleSwitcherSegmentProps | LocaleSwitcherMenuProps;

/** Public pills (preserve query) or app-header dropdown. */
export function LocaleSwitcher(props: LocaleSwitcherProps) {
  if (props.variant === "segment") {
    return (
      <Suspense fallback={<LocaleLinks locale={props.locale} className={props.className} query="" />}>
        <LocaleSegmentSearch locale={props.locale} className={props.className} />
      </Suspense>
    );
  }
  return <LocaleMenu {...props} />;
}

function LocaleSegmentSearch({ locale, className }: Omit<LocaleSwitcherSegmentProps, "variant">) {
  const search = useSearchParams();
  return <LocaleLinks locale={locale} className={className} query={search.toString()} />;
}

function LocaleLinks({
  locale,
  className,
  query,
}: Omit<LocaleSwitcherSegmentProps, "variant"> & { query: string }) {
  const pathname = usePathname();
  const t = useTranslations("common");

  return (
    <nav className={cn(segment.nav, className)} aria-label={t("language")}>
      <div className={segment.group}>
        {locales.map((loc) => {
          const active = loc === locale;
          return (
            <Link
              key={loc}
              href={`${withLocale(pathname, loc)}${query ? `?${query}` : ""}`}
              className={active ? segment.itemActive : segment.item}
              aria-current={active ? "true" : undefined}
              aria-label={localeNames[loc]}
              title={localeNames[loc]}
            >
              {localeShortLabels[loc]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function LocaleMenu({
  locale,
  compact = false,
  fullWidth = false,
  onSelect,
}: Omit<LocaleSwitcherMenuProps, "variant">) {
  const t = useTranslations("common");
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
        aria-label={localeNames[current]}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={shellStyles.localePickerLabel}>
          {fullWidth ? localeNames[current] : localeShortLabels[current]}
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
                  <span className="truncate">{localeNames[loc]}</span>
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