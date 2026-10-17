import { PageHeader } from "@/components/layout/app-shell";
import { TeammatesManager } from "@/components/teammates/teammates-manager";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/services";
import { requireAppSession } from "@/lib/require-session";

export default async function TeammatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    invitationError?: string;
  }>;
}) {
  const { locale } = await params;
  const { invitationError } = await searchParams;
  const t = await getTranslations();
  const session = await requireAppSession(locale);
  const isOperator = session.user.role === "operator";
  const { teammates, invitations } = getServices();

  const [users, groupInvitations] = await Promise.all([
    teammates.listOrganizationUsers({ session }),
    invitations.listForGroup({ session }),
  ]);

  return (
    <>
      <PageHeader title={t("common.teammates")} />
      <TeammatesManager
        locale={locale}
        currentUserId={session.user.id}
        users={users}
        invitations={groupInvitations}
        isOperator={isOperator}
        invitationError={invitationError === "1"}
      />
    </>
  );
}
