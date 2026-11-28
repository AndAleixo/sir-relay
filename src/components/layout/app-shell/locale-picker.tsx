"use client";

import type { AppLocale } from "@/i18n/config";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

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
  return (
    <LocaleSwitcher
      variant="menu"
      locale={locale}
      compact={compact}
      fullWidth={fullWidth}
      onSelect={onSelect}
    />
  );
}