import { getTranslations } from "next-intl/server";
import { landingStyles } from "./landing.styles";

const faqKeys = ["what", "groups", "metrics", "data"] as const;

export async function LandingFaq() {
  const t = await getTranslations();

  return (
    <section id="faq" className={landingStyles.faq}>
      <div className={landingStyles.faqInner}>
        <h2 className={landingStyles.faqTitle}>{t("landing.faqTitle")}</h2>
        <div className={landingStyles.faqList}>
          {faqKeys.map((key, i) => (
            <details key={key} className={landingStyles.faqItem} open={i === 0}>
              <summary className={landingStyles.faqQuestion}>
                <span>{t(`landing.faq.${key}.q`)}</span>
              </summary>
              <p className={landingStyles.faqAnswer}>{t(`landing.faq.${key}.a`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
