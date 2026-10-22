import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSegment } from "@/components/layout/locale-segment";
import { Button } from "@/components/ui/button";
import { withConnectNext } from "@/lib/connect-next";
import { landingStyles } from "./landing.styles";

type LandingHeaderProps = {
  locale: string;
  returnTo?: string | null;
  showAccountLinks?: boolean;
};

export async function LandingHeader({
  locale,
  returnTo = null,
  showAccountLinks = true,
}: LandingHeaderProps) {
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
          {showAccountLinks ? (
            <>
              <Link
                href={withConnectNext(`/${locale}/login`, returnTo)}
                className={landingStyles.headerLoginLink}
              >
                {t("auth.login")}
              </Link>
              <Link href={withConnectNext(`/${locale}/signup`, returnTo)}>
                <Button className={landingStyles.headerSignup}>{t("auth.signup")}</Button>
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
