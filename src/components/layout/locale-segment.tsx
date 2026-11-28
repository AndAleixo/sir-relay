"use client";

import { LocaleSwitcher } from "@/components/layout/locale-switcher";

type LocaleSegmentProps = {
  locale: string;
  className?: string;
};

/** Visible EN / ES / PT. The full name stays on the link for assistive tech. */
export function LocaleSegment(props: LocaleSegmentProps) {
  return <LocaleSwitcher variant="segment" {...props} />;
}