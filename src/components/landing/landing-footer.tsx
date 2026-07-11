import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { landingStyles } from "./landing.styles";

type LandingFooterProps = {
  locale: string;
};

export async function LandingFooter({ locale }: LandingFooterProps) {
  const t = await getTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className={landingStyles.footer}>
      <div className={landingStyles.footerInner}>
        <p className={landingStyles.footerCopy}>
          {t("landing.footerCopy", { year })}
        </p>
        <nav className={landingStyles.footerLinks} aria-label={t("landing.footerNav")}>
          <Link href={`/${locale}/privacy`} className={landingStyles.footerLink}>
            {t("admin.privacyLink")}
          </Link>
          <Link href={`/${locale}/admin`} className={landingStyles.footerLink}>
            {t("auth.login")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
