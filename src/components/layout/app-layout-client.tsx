"use client";

import type { User } from "@/domain/types";
import { AppShell } from "@/components/layout/app-shell";
import { SyncProvider, SyncBar } from "@/components/sync";

interface AppLayoutClientProps {
  locale: string;
  user: User;
  children: React.ReactNode;
}

export function AppLayoutClient({ locale, user, children }: AppLayoutClientProps) {
  return (
    <SyncProvider>
      <SyncBar />
      <AppShell locale={locale} user={user}>
        {children}
      </AppShell>
    </SyncProvider>
  );
}
