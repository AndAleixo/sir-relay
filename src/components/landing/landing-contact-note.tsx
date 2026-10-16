import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { landingStyles } from "./landing.styles";

type LandingContactNoteProps = {
  locale: string;
};

export async function LandingContactNote({ locale }: LandingContactNoteProps) {
  const t = await getTranslations();

  return (
    <section className={landingStyles.contactNote} aria-label={t("contact.title")}>
      <p className={landingStyles.contactNoteText}>
        {t("landing.contactLead")}{" "}
        <Link href={`/${locale}/contact`} className={landingStyles.contactNoteLink}>
          {t("contact.title")}
        </Link>
        .
      </p>
    </section>
  );
}
