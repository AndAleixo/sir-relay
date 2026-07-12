"use client";

import { usePathname, useRouter } from "next/navigation";
import type { AppLocale } from "@/i18n/config";
import { LocalePicker } from "./locale-picker";

interface LocaleSwitcherProps {
  locale: string;
  compact?: boolean;
}

export function LocaleSwitcher({ locale, compact }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  function onSelect(newLocale: AppLocale) {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  }

  return <LocalePicker locale={locale} compact={compact} onSelect={onSelect} />;
}
