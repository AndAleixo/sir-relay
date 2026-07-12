"use client";

import type { User, UserGroup } from "@/domain/types";
import { AppShell } from "@/components/layout/app-shell";
import { SyncProvider, SyncBar } from "@/components/sync";

interface AppLayoutClientProps {
  locale: string;
  user: User;
  groups: UserGroup[];
  activeGroupId: string | null;
  children: React.ReactNode;
}

export function AppLayoutClient({
  locale,
  user,
  groups,
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
        activeGroupId={activeGroupId}
      >
        {children}
      </AppShell>
    </SyncProvider>
  );
}
