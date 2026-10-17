export const locales = ["en-gb", "es-es", "pt-br"] as const;

export type AppLocale = (typeof locales)[number];

/** Postgres enum Locale — short codes; map at API boundary */
export type DbLocale = "en" | "es" | "pt";

export const defaultLocale: AppLocale = "en-gb";

export const localeNames: Record<AppLocale, string> = {
  "en-gb": "English (UK)",
  "es-es": "Español (España)",
  "pt-br": "Português (Brasil)",
};

/** Short mark for chrome (EN · ES · PT). Full names stay in menus and settings. */
export const localeShortLabels: Record<AppLocale, string> = {
  "en-gb": "EN",
  "es-es": "ES",
  "pt-br": "PT",
};

const appToDb: Record<AppLocale, DbLocale> = {
  "en-gb": "en",
  "es-es": "es",
  "pt-br": "pt",
};

const dbToApp: Record<DbLocale, AppLocale> = {
  en: "en-gb",
  es: "es-es",
  pt: "pt-br",
};

export function toDbLocale(locale: AppLocale): DbLocale {
  return appToDb[locale];
}

export function toAppLocale(locale: DbLocale): AppLocale {
  return dbToApp[locale];
}

/** Replace the locale prefix, keeping the rest of the path. */
export function withLocale(pathname: string, locale: AppLocale): string {
  const head = pathname.split("/")[1] ?? "";
  if ((locales as readonly string[]).includes(head)) {
    return `/${locale}${pathname.slice(head.length + 1)}`;
  }
  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}

/** Regex segment for middleware — hyphens escaped */
export function localePathPattern(): string {
  return locales.map((loc) => loc.replace(/-/g, "\\-")).join("|");
}
