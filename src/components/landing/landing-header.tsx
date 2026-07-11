import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { localeNames, locales, type AppLocale } from "@/i18n/config";
import { landingStyles } from "./landing.styles";

type LandingHeaderProps = {
  locale: string;
};

export async function LandingHeader({ locale }: LandingHeaderProps) {
  const t = await getTranslations();

  return (
    <header className={landingStyles.header}>
      <div className={landingStyles.headerInner}>
        <Link href={`/${locale}`} aria-label={t("common.appName")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.svg" alt={t("common.appName")} className={landingStyles.logo} />
        </Link>
        <nav className={landingStyles.nav} aria-label={t("landing.headerNav")}>
          <div className="hidden items-center gap-2 sm:flex">
            {locales.map((loc) => (
              <Link
                key={loc}
                href={`/${loc}`}
                className={loc === locale ? landingStyles.localeActive : landingStyles.localeLink}
              >
                {localeNames[loc as AppLocale]}
              </Link>
            ))}
          </div>
          <Link href={`/${locale}/admin`}>
            <Button variant="secondary">{t("auth.login")}</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
