"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateUserLocale } from "@/app/actions/mock-settings";
import { localeNames, locales, type AppLocale } from "@/i18n/config";
import { shellStyles } from "@/components/layout/app-shell/app-shell.styles";

interface SettingsLocaleFieldProps {
  locale: string;
}

export function SettingsLocaleField({ locale }: SettingsLocaleFieldProps) {
  const t = useTranslations("profile");
  const pathname = usePathname();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = event.target.value;
    if (newLocale === locale) return;
    void updateUserLocale(newLocale, pathname);
  }

  return (
    <select
      value={locale}
      onChange={onChange}
      aria-label={t("language")}
      className={shellStyles.localeSelect}
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeNames[loc as AppLocale]}
        </option>
      ))}
    </select>
  );
}
