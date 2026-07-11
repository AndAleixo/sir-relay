"use client";

import type { User } from "@/domain/types";
import { AppShell } from "@/components/layout/app-shell";
import type { ShellGroup } from "@/components/layout/app-shell/group-switcher";
import { SyncProvider, SyncBar } from "@/components/sync";

interface AppLayoutClientProps {
  locale: string;
  user: User;
  groups: ShellGroup[];
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
