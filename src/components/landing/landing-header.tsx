import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { LandingLocaleNav } from "./landing-locale-nav";
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
          <LandingLocaleNav locale={locale} />
          <Link
            href={`/${locale}/contact`}
            className="hidden text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] sm:inline"
          >
            {t("contact.title")}
          </Link>
          <Link href={`/${locale}/signup`}>
            <Button variant="ghost">{t("auth.signup")}</Button>
          </Link>
          <Link href={`/${locale}/login`}>
            <Button variant="secondary">{t("auth.login")}</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
