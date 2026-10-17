import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSegment } from "@/components/layout/locale-segment";
import { Button } from "@/components/ui/button";
import { landingStyles } from "./landing.styles";

type LandingHeaderProps = {
  locale: string;
};

export async function LandingHeader({ locale }: LandingHeaderProps) {
  const t = await getTranslations();

  return (
    <header className={landingStyles.header}>
      <div className={landingStyles.headerInner}>
        <Link
          href={`/${locale}`}
          aria-label={t("common.appName")}
          className={landingStyles.headerBrand}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-compact.svg"
            alt=""
            className={landingStyles.logoCompact}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.svg" alt="" className={landingStyles.logo} />
        </Link>
        <LocaleSegment locale={locale} className={landingStyles.headerLocale} />
        <nav className={landingStyles.nav} aria-label={t("landing.headerNav")}>
          <Link href={`/${locale}/login`} className={landingStyles.headerLoginLink}>
            {t("auth.login")}
          </Link>
          <Link href={`/${locale}/signup`}>
            <Button className={landingStyles.headerSignup}>{t("auth.signup")}</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
