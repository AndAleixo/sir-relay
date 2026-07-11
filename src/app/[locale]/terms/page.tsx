import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardBody } from "@/components/ui/card";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className="mx-auto w-full max-w-2xl flex-1 py-12">
        <AuthPageHeader locale={locale} />
        <Card>
          <CardBody className="space-y-4">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {t("terms.title")}
            </h1>
            <p className="text-sm text-[var(--text-primary)]">{t("terms.stub")}</p>
            <Link
              href={`/${locale}/login`}
              className="inline-block text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
            >
              {t("auth.login")}
            </Link>
          </CardBody>
        </Card>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
