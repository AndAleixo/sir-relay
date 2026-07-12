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

export const localeCompactLabels: Record<AppLocale, string> = {
  "en-gb": "EN-GB",
  "es-es": "ES-ES",
  "pt-br": "PT-BR",
};

/** Short labels for marketing header (EN · ES · PT). */
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

/** Regex segment for middleware — hyphens escaped */
export function localePathPattern(): string {
  return locales.map((loc) => loc.replace(/-/g, "\\-")).join("|");
}
