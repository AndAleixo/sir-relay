"use client";

import type { GroupInvitation, User, UserGroup } from "@/domain/types";
import { AppShell } from "@/components/layout/app-shell";
import { SyncProvider, SyncBar } from "@/components/sync";

interface AppLayoutClientProps {
  locale: string;
  user: User;
  groups: UserGroup[];
  invitations: GroupInvitation[];
  activeGroupId: string | null;
  children: React.ReactNode;
}

export function AppLayoutClient({
  locale,
  user,
  groups,
  invitations,
  activeGroupId,
  children,
}: AppLayoutClientProps) {
  return (
    <SyncProvider>
      <SyncBar />
      <AppShell
        locale={locale}
        user={user}
        groups={groups}
        invitations={invitations}
        activeGroupId={activeGroupId}
      >
        {children}
      </AppShell>
    </SyncProvider>
  );
}
