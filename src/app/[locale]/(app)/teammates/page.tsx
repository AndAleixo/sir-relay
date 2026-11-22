import { TeammatesManager } from "@/components/teammates/teammates-manager";
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
  const session = await requireAppSession(locale);
  const isOperator = session.user.role === "operator";
  const { teammates, invitations } = getServices();

  const [users, groupInvitations] = await Promise.all([
    teammates.listOrganizationUsers({ session }),
    invitations.listForGroup({ session }),
  ]);

  return (
    <TeammatesManager
      locale={locale}
      currentUserId={session.user.id}
      users={users}
      invitations={groupInvitations}
      isOperator={isOperator}
      invitationError={invitationError === "1"}
    />
  );
}
