import type { Metadata } from "next";
import { locales, type AppLocale } from "@/i18n/config";
import { siteOrigin, siteUrl } from "@/lib/site";

export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
};

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

export function seoMetadataBase(): URL {
  return new URL(`${siteOrigin()}/`);
}

/** Canonical + hreflang for a public path under the active locale. */
export function publicPageAlternates(
  locale: string,
  pathAfterLocale = "",
): Metadata["alternates"] {
  const suffix = pathAfterLocale
    ? pathAfterLocale.startsWith("/")
      ? pathAfterLocale
      : `/${pathAfterLocale}`
    : "";

  const languages: Record<string, string> = {
    "x-default": siteUrl(`/en-gb${suffix}`),
  };
  for (const loc of locales) {
    languages[loc] = siteUrl(`/${loc}${suffix}`);
  }

  return {
    canonical: siteUrl(`/${locale}${suffix}`),
    languages,
  };
}

export function publicPageMetadata(input: {
  locale: string;
  pathAfterLocale?: string;
  title: string;
  description: string;
  /** Skip the root "%s · SRelay" template. */
  absoluteTitle?: boolean;
}): Metadata {
  const {
    locale,
    pathAfterLocale = "",
    title,
    description,
    absoluteTitle = false,
  } = input;
  const resolvedTitle = absoluteTitle ? { absolute: title } : title;
  return {
    title: resolvedTitle,
    description,
    alternates: publicPageAlternates(locale, pathAfterLocale),
    openGraph: { title, description },
    twitter: { title, description },
  };
}
