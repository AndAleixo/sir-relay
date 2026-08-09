import { getTranslations } from "next-intl/server";
import { LegalDoc } from "@/components/legal/legal-doc";
import { LEGAL_DOCUMENT, resolveContactEmail } from "@/lib/legal";

export default async function PrivacyPage({
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
      title={doc.privacyTitle}
      updated={doc.updated}
      note={t("legal.canonicalNote")}
      intro={doc.privacyIntro}
      sections={doc.privacy}
      contact={t("legal.contact", { email: resolveContactEmail() })}
      loginLabel={t("auth.login")}
    />
  );
}
