import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { ConnectClient } from "@/components/connect/connect-client";
import { Card, CardBody } from "@/components/ui/card";
import { loginPath } from "@/lib/entry-route";
import { editorUriScheme } from "@/lib/connect-next";
import { listClientApiKeys } from "@/lib/link-token";
import { getServices } from "@/services";

export default async function ConnectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ scheme?: string }>;
}) {
  const { locale } = await params;
  const { scheme: schemeRaw } = await searchParams;
  const scheme = editorUriScheme(schemeRaw);
  const t = await getTranslations();
  const session = await getServices().auth.getSession();
  if (!session) {
    redirect(
      loginPath(locale, {
        next: `/${locale}/connect?scheme=${scheme}`,
      }),
    );
  }

  const { groups } = getServices();
  const [apiKeys, groupList] = await Promise.all([
    listClientApiKeys(session.user.id),
    groups.listForUser(session.user.id),
  ]);
  const apiKeyGroups = groupList.map((g) => ({ id: g.id, name: g.name }));

  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-12">
        <AuthPageHeader locale={locale} />
        <Card>
          <CardBody className="space-y-5">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("profile.linkKeySection")}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {t("profile.linkKeyPageLead", { name: session.user.name })}
              </p>
            </div>
            <ConnectClient
              scheme={scheme}
              initialKeys={apiKeys}
              groups={apiKeyGroups}
            />
          </CardBody>
        </Card>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
