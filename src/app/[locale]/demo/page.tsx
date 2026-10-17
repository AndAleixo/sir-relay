import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DemoGateForm } from "@/components/demo/demo-gate-form";
import { DemoProvider } from "@/components/demo/demo-provider";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardBody } from "@/components/ui/card";

export default async function DemoGatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <DemoProvider fresh>
      <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
        <div className={authShellStyles.loginWrap}>
          <AuthPageHeader locale={locale} />
          <Card>
            <CardBody className="space-y-4">
              <div className="text-center">
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                  {t("demo.gateTitle")}
                </h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {t("demo.gateSubtitle")}
                </p>
              </div>
              <p className="rounded-button border border-brand-accent/30 bg-brand-accent-soft px-3 py-2 text-center text-sm text-[var(--text-primary)]">
                {t("demo.notice")}
              </p>
              <DemoGateForm locale={locale} />
              <p className="text-center text-sm text-[var(--text-muted)]">
                {t("demo.preferAccount")}{" "}
                <Link
                  href={`/${locale}/signup`}
                  className="font-medium text-brand-accent hover:text-brand-accent-hover"
                >
                  {t("auth.signup")}
                </Link>
              </p>
            </CardBody>
          </Card>
        </div>
        <SiteFooter locale={locale} />
      </div>
    </DemoProvider>
  );
}
