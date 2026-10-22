import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { landingStyles } from "@/components/landing/landing.styles";
import { withConnectNext } from "@/lib/connect-next";

type SiteFooterProps = {
  locale: string;
  variant?: "marketing" | "auth";
  returnTo?: string | null;
};

export async function SiteFooter({
  locale,
  variant = "auth",
  returnTo = null,
}: SiteFooterProps) {
  const t = await getTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className={landingStyles.footer}>
      <div className={landingStyles.footerInner}>
        <p className={landingStyles.footerCopy}>
          {t("landing.footerCopy", { year })}
        </p>
        <nav className={landingStyles.footerLinks} aria-label={t("landing.footerNav")}>
          {variant === "marketing" ? (
            <Link href={`/${locale}#faq`} className={landingStyles.footerLink}>
              {t("landing.faqTitle")}
            </Link>
          ) : null}
          <Link href={`/${locale}/contact`} className={landingStyles.footerLink}>
            {t("contact.title")}
          </Link>
          <Link href={`/${locale}/privacy`} className={landingStyles.footerLink}>
            {t("legal.privacy")}
          </Link>
          <Link href={`/${locale}/terms`} className={landingStyles.footerLink}>
            {t("legal.terms")}
          </Link>
          <Link href={withConnectNext(`/${locale}/login`, returnTo)} className={landingStyles.footerLink}>
            {t("auth.login")}
          </Link>
          <Link href={withConnectNext(`/${locale}/signup`, returnTo)} className={landingStyles.footerLink}>
            {t("auth.signup")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
