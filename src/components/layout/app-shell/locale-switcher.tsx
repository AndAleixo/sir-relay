"use client";

import { LocaleSwitcher as LocaleSwitcherControl } from "@/components/layout/locale-switcher";

interface LocaleSwitcherProps {
  locale: string;
  compact?: boolean;
}

/** App chrome uses the same EN/ES/PT segment control as landing, demo, and /connect. */
export function LocaleSwitcher({ locale, compact: _compact }: LocaleSwitcherProps) {
  return <LocaleSwitcherControl variant="segment" locale={locale} />;
}
