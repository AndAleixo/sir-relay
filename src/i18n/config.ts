export const locales = ["en", "es", "pt"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export const localeNames: Record<AppLocale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
};
