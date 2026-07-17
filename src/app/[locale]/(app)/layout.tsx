import { redirect } from "next/navigation";
import { AppLayoutClient } from "@/components/layout/app-layout-client";
import { requireSession } from "@/lib/require-session";
import { getServices } from "@/services";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireSession(locale);
  if (session.user.mustChangePassword) {
    redirect(`/${locale}/change-password`);
  }
  const { groups, invitations } = getServices();
  const [groupList, pendingInvitations] = await Promise.all([
    groups.listForUser(session.user.id),
    invitations.listForUser(session.user.id),
  ]);

  return (
    <AppLayoutClient
      locale={locale}
      user={session.user}
      groups={groupList}
      invitations={pendingInvitations}
      activeGroupId={session.activeGroupId}
    >
      {children}
    </AppLayoutClient>
  );
}
