"use client";

import { usePathname } from "next/navigation";
import { updateUserLocale } from "@/app/actions/settings";
import type { AppLocale } from "@/i18n/config";
import { LocalePicker } from "@/components/layout/app-shell/locale-picker";

interface SettingsLocaleFieldProps {
  locale: string;
}

export function SettingsLocaleField({ locale }: SettingsLocaleFieldProps) {
  const pathname = usePathname();

  function onSelect(newLocale: AppLocale) {
    if (newLocale === locale) return;
    void updateUserLocale(newLocale, pathname);
  }

  return <LocalePicker locale={locale} fullWidth onSelect={onSelect} />;
}
