"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { localeNames, locales, type AppLocale } from "@/i18n/config";
import { shellStyles } from "./app-shell.styles";

interface LocaleSwitcherProps {
  locale: string;
  compact?: boolean;
}

export function LocaleSwitcher({ locale, compact }: LocaleSwitcherProps) {
  const t = useTranslations("profile");
  const pathname = usePathname();
  const router = useRouter();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = event.target.value;
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  }

  return (
    <select
      value={locale}
      onChange={onChange}
      aria-label={t("language")}
      className={compact ? shellStyles.localeSelectCompact : shellStyles.localeSelect}
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {compact ? loc.toUpperCase() : localeNames[loc as AppLocale]}
        </option>
      ))}
    </select>
  );
}
