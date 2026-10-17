"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useDemoActions,
  useDemoReady,
  useDemoWorkspace,
} from "@/components/demo/demo-provider";
import { AppShell } from "@/components/layout/app-shell";
import { syncBarStyles } from "@/components/sync/sync-bar.styles";
import { cn } from "@/lib/cn";
import { demoMemberAsUser } from "@/lib/demo-workspace";

export function DemoAppFrame({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();
  const ready = useDemoReady();
  const workspace = useDemoWorkspace();
  const { leave } = useDemoActions();
  const checkedEntry = useRef(false);

  useEffect(() => {
    if (!ready || checkedEntry.current) return;
    checkedEntry.current = true;
    if (!workspace) router.replace(`/${locale}/demo`);
  }, [locale, ready, router, workspace]);

  if (!ready || !workspace) return null;

  const self =
    workspace.members.find((member) => member.id === workspace.selfId) ??
    workspace.members[0];
  if (!self) return null;

  const user = demoMemberAsUser(self, workspace.selfId, locale);
  const basePath = `/${locale}/demo/app`;

  return (
    <>
      <div role="status" className={cn(syncBarStyles.root, syncBarStyles.warning)}>
        <p className={syncBarStyles.message}>{t("demo.banner")}</p>
        <div className={syncBarStyles.actions}>
          <Link
            href={`/${locale}/signup`}
            className="text-xs font-semibold text-brand-accent hover:text-brand-accent-hover"
          >
            {t("demo.bannerCta")}
          </Link>
        </div>
      </div>
      <AppShell
        locale={locale}
        user={user}
        groups={[
          {
            id: workspace.groupId,
            name: t("demo.groupName"),
            ownerUserId: self.id,
            role: "operator",
          },
        ]}
        invitations={[]}
        activeGroupId={workspace.groupId}
        demo={{
          basePath,
          onLeave: () => {
            leave();
            router.push(`/${locale}`);
          },
        }}
      >
        {children}
      </AppShell>
    </>
  );
}
