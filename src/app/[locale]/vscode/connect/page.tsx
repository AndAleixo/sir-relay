import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { ConnectVsCode } from "@/components/vscode/connect-vscode";
import { Card, CardBody } from "@/components/ui/card";
import { loginPath } from "@/lib/entry-route";
import { vsCodeScheme } from "@/lib/vscode-next";
import { getServices } from "@/services";

export default async function VsCodeConnectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ scheme?: string }>;
}) {
  const { locale } = await params;
  const { scheme: schemeRaw } = await searchParams;
  const scheme = vsCodeScheme(schemeRaw);
  const t = await getTranslations();
  const session = await getServices().auth.getSession();
  if (!session) {
    redirect(
      loginPath(locale, {
        next: `/${locale}/vscode/connect?scheme=${scheme}`,
      }),
    );
  }

  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className={authShellStyles.loginWrap}>
        <AuthPageHeader locale={locale} />
        <Card>
          <CardBody className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("landing.editor.linkTitle")}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {t("landing.editor.accountLine", { name: session.user.name })}
              </p>
            </div>
            <ConnectVsCode scheme={scheme} />
          </CardBody>
        </Card>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
