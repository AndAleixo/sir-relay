import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ProductDemo } from "./product-demo";
import { landingStyles } from "./landing.styles";

type LandingHeroProps = {
  locale: string;
};

export async function LandingHero({ locale }: LandingHeroProps) {
  const t = await getTranslations();

  return (
    <section className={landingStyles.hero}>
      <div className={landingStyles.heroGrid}>
        <div>
          <p className={landingStyles.eyebrow}>{t("landing.eyebrow")}</p>
          <h1 className={landingStyles.heroTitle}>{t("landing.heroTitle")}</h1>
          <p className={landingStyles.heroSubtitle}>{t("landing.heroSubtitle")}</p>
          <div className={landingStyles.heroActions}>
            <Link href={`/${locale}/signup`}>
              <Button>{t("auth.signup")}</Button>
            </Link>
          </div>
        </div>
        <ProductDemo locale={locale} />
      </div>
    </section>
  );
}
