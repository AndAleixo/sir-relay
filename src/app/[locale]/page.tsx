import { redirect } from "next/navigation";
import { getServices } from "@/services";
import { resolveEntryPath } from "@/lib/entry-route";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { landingStyles } from "@/components/landing/landing.styles";

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { auth } = getServices();
  const session = await auth.getSession();

  if (session) {
    redirect(resolveEntryPath(locale, session));
  }

  return (
    <div className={landingStyles.page}>
      <LandingHeader locale={locale} />
      <main className={landingStyles.main}>
        <LandingHero locale={locale} />
        <LandingFeatures />
      </main>
      <LandingFooter locale={locale} />
    </div>
  );
}
