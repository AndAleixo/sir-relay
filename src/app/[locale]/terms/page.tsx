import { getTranslations } from "next-intl/server";
import { LegalDoc } from "@/components/legal/legal-doc";
import { LEGAL_DOCUMENT, resolveContactEmail } from "@/lib/legal";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const doc = LEGAL_DOCUMENT;

  return (
    <LegalDoc
      locale={locale}
      title={doc.termsTitle}
      updated={doc.updated}
      note={t("legal.canonicalNote")}
      intro={doc.termsIntro}
      sections={doc.terms}
      contact={t("legal.contact", { email: resolveContactEmail() })}
      loginLabel={t("auth.login")}
    />
  );
}
