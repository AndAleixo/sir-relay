import { getTranslations } from "next-intl/server";
import { landingStyles } from "./landing.styles";

export async function LandingFeatures() {
  const t = await getTranslations();
  const items = ["simple", "calm", "relay"] as const;

  return (
    <section className={landingStyles.features}>
      <div className={landingStyles.featuresInner}>
        <h2 className={landingStyles.featuresTitle}>{t("landing.featuresTitle")}</h2>
        <p className={landingStyles.featuresLead}>{t("landing.featuresLead")}</p>
        <div className={landingStyles.featureGrid}>
          {items.map((key) => (
            <article key={key} className={landingStyles.featureCard}>
              <h3 className={landingStyles.featureTitle}>{t(`landing.feature.${key}.title`)}</h3>
              <p className={landingStyles.featureBody}>{t(`landing.feature.${key}.body`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
