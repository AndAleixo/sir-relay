"use client";

import { usePathname, useRouter } from "next/navigation";
import { updateUserLocale } from "@/app/actions/settings";
import type { AppLocale } from "@/i18n/config";
import { LocalePicker } from "@/components/layout/app-shell/locale-picker";

interface SettingsLocaleFieldProps {
  locale: string;
  /** No session — rewrite locale segment in the current path only. */
  sessionless?: boolean;
}

export function SettingsLocaleField({
  locale,
  sessionless = false,
}: SettingsLocaleFieldProps) {
  const pathname = usePathname();
  const router = useRouter();

  function onSelect(newLocale: AppLocale) {
    if (newLocale === locale) return;
    if (sessionless) {
      const segments = pathname.split("/");
      segments[1] = newLocale;
      router.replace(segments.join("/") || `/${newLocale}`);
      return;
    }
    void updateUserLocale(newLocale, pathname);
  }

  return <LocalePicker locale={locale} fullWidth onSelect={onSelect} />;
}
