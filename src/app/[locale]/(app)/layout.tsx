import { redirect } from "next/navigation";
import { AppLayoutClient } from "@/components/layout/app-layout-client";
import type { ShellGroup } from "@/components/layout/app-shell/group-switcher";
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
  const { groups } = getServices();
  const groupList = await groups.listForUser(session.user.id);

  const shellGroups: ShellGroup[] = await Promise.all(
    groupList.map(async (group) => ({
      id: group.id,
      name: group.name,
      role: (await groups.roleInGroup(session.user.id, group.id)) ?? "teammate",
    })),
  );

  return (
    <AppLayoutClient
      locale={locale}
      user={session.user}
      groups={shellGroups}
      activeGroupId={session.activeGroupId}
    >
      {children}
    </AppLayoutClient>
  );
}
