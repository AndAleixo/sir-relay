import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  localeNames,
  localeShortLabels,
  locales,
  type AppLocale,
} from "@/i18n/config";
import { landingStyles } from "./landing.styles";

type LandingLocaleNavProps = {
  locale: string;
};

export async function LandingLocaleNav({ locale }: LandingLocaleNavProps) {
  const t = await getTranslations("landing");

  return (
    <nav className={landingStyles.localeNav} aria-label={t("language")}>
      <div
        className={landingStyles.localeSegmentGroup}
        role="group"
        aria-label={t("language")}
      >
        {locales.map((loc) => {
          const active = loc === locale;
          return (
            <Link
              key={loc}
              href={`/${loc}`}
              className={
                active ? landingStyles.localeSegmentActive : landingStyles.localeSegment
              }
              aria-current={active ? "true" : undefined}
              title={localeNames[loc as AppLocale]}
            >
              {localeShortLabels[loc as AppLocale]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
