import { getTranslations } from "next-intl/server";
import { landingStyles } from "./landing.styles";

const faqKeys = ["what", "groups", "metrics", "telegram", "data"] as const;

export async function LandingFaq() {
  const t = await getTranslations();

  return (
    <section id="faq" className={landingStyles.features}>
      <div className={landingStyles.featuresInner}>
        <h2 className={landingStyles.featuresTitle}>{t("landing.faqTitle")}</h2>
        <div className="mx-auto mt-10 max-w-2xl space-y-6">
          {faqKeys.map((key) => (
            <article key={key}>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {t(`landing.faq.${key}.q`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {t(`landing.faq.${key}.a`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
