import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { resolveEntryPath } from "@/lib/entry-route";
import { LandingEditor } from "@/components/landing/landing-editor";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingContactNote } from "@/components/landing/landing-contact-note";
import { LandingFaq } from "@/components/landing/landing-faq";
import { SiteFooter } from "@/components/layout/site-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { landingStyles } from "@/components/landing/landing.styles";
import { safeConnectNext } from "@/lib/connect-next";
import { publicPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  return publicPageMetadata({
    locale,
    title: `SRelay — ${t("heroTitle")}`,
    description: t("heroSubtitle"),
    absoluteTitle: true,
  });
}

export default async function LocaleHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  const returnTo = safeConnectNext(locale, next);
  const { auth } = getServices();
  const session = await auth.getSession();

  if (session) {
    redirect(resolveEntryPath(locale, session));
  }

  return (
    <div className={landingStyles.page}>
      <LandingHeader locale={locale} returnTo={returnTo} />
      <main className={landingStyles.main}>
        <LandingHero locale={locale} />
        <LandingFeatures />
        <LandingEditor />
        <LandingContactNote locale={locale} />
        <LandingFaq />
      </main>
      <SiteFooter locale={locale} variant="marketing" returnTo={returnTo} />
    </div>
  );
}
