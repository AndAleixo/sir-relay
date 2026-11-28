import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { ConnectClient } from "@/components/connect/connect-client";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { editorUriScheme } from "@/lib/connect-next";
import { listClientApiKeys } from "@/lib/link-token";
import { noIndexMetadata } from "@/lib/seo";
import { siteOrigin } from "@/lib/site";
import { requireSession } from "@/lib/require-session";
import { getServices } from "@/services";

const OPEN_VSX_URL = "https://open-vsx.org/extension/sirrelay/sirrelay";
const MCP_NPM_URL = "https://www.npmjs.com/package/@sirrelay/mcp";

export const metadata: Metadata = noIndexMetadata;

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
  const session = await requireSession(locale);

  const { groups } = getServices();
  const [apiKeys, groupList] = await Promise.all([
    listClientApiKeys(session.user.id),
    groups.listForUser(session.user.id),
  ]);
  const apiKeyGroups = groupList.map((g) => ({ id: g.id, name: g.name }));

  return (
    <>
      <PageHeader
        title={t("profile.linkKeySection")}
        subtitle={t("profile.linkKeyPageLead", { name: session.user.name })}
      />
      <Card className="min-w-0 max-w-2xl">
        <CardBody className="space-y-5">
          <ConnectClient
            scheme={scheme}
            appUrl={siteOrigin()}
            initialKeys={apiKeys}
            groups={apiKeyGroups}
          />
          <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:flex-wrap">
            <ButtonLink
              href={OPEN_VSX_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              {t("profile.linkKeyExtensionDownload")}
            </ButtonLink>
            <ButtonLink
              href={MCP_NPM_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              {t("profile.linkKeyMcpPackage")}
            </ButtonLink>
          </div>
        </CardBody>
      </Card>
    </>
  );
}