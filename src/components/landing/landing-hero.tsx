import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
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
            <ButtonLink href={`/${locale}/demo`}>{t("demo.tryDemo")}</ButtonLink>
          </div>
        </div>
        <ProductDemo locale={locale} />
      </div>
    </section>
  );
}
