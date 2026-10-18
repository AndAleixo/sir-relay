"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  localeNames,
  localeShortLabels,
  locales,
  withLocale,
} from "@/i18n/config";
import { cn } from "@/lib/cn";

const segment = {
  nav: "shrink-0",
  group:
    "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-bg)] p-0.5 shadow-sm",
  item: "min-w-[1.75rem] rounded-full px-1.5 py-1 text-center text-[11px] font-medium tracking-wide text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent sm:min-w-[2.75rem] sm:px-3 sm:py-1.5 sm:text-xs",
  itemActive:
    "min-w-[1.75rem] rounded-full bg-surface-card px-1.5 py-1 text-center text-[11px] font-semibold tracking-wide text-[var(--text-primary)] shadow-sm ring-1 ring-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent sm:min-w-[2.75rem] sm:px-3 sm:py-1.5 sm:text-xs",
} as const;

type LocaleSegmentProps = {
  locale: string;
  className?: string;
};

/** Visible EN / ES / PT. The full name stays on the link for assistive tech. */
export function LocaleSegment(props: LocaleSegmentProps) {
  return (
    <Suspense fallback={<LocaleLinks {...props} query="" />}>
      <LocaleSegmentSearch {...props} />
    </Suspense>
  );
}

function LocaleSegmentSearch({ locale, className }: LocaleSegmentProps) {
  const search = useSearchParams();
  return <LocaleLinks locale={locale} className={className} query={search.toString()} />;
}

function LocaleLinks({
  locale,
  className,
  query,
}: LocaleSegmentProps & { query: string }) {
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
