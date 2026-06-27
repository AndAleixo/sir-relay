"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Role, User } from "@/domain/types";
import { cn } from "@/lib/cn";
import { shellStyles } from "./app-shell.styles";

interface NavItem {
  href: string;
  label: string;
  roles: Role[];
}

interface AppShellProps {
  locale: string;
  user: User;
  children: React.ReactNode;
}

export function AppShell({ locale, user, children }: AppShellProps) {
  const t = useTranslations();
  const isOperator = user.role === "operator";

  const nav: NavItem[] = [
    {
      href: `/${locale}/tasks`,
      label: t("common.tasks"),
      roles: ["operator", "teammate"],
    },
    {
      href: `/${locale}/teammates`,
      label: t("common.teammates"),
      roles: ["operator"],
    },
    {
      href: `/${locale}/settings`,
      label: t("common.settings"),
      roles: ["operator", "teammate"],
    },
  ];

  return (
    <div className={shellStyles.root}>
      <aside className={shellStyles.sidebar}>
        <Link href={`/${locale}/tasks`} className={shellStyles.logoLink}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.svg" alt={t("common.appName")} className="h-8" />
        </Link>
        <nav className={shellStyles.nav}>
          {nav
            .filter((item) => item.roles.includes(user.role))
            .map((item) => (
              <Link key={item.href} href={item.href} className={shellStyles.navLink}>
                {item.label}
              </Link>
            ))}
        </nav>
        <div className={shellStyles.sidebarFooter}>
          <p className={shellStyles.userName}>{user.name}</p>
          <p className={shellStyles.userRole}>{t(`roles.${user.role}`)}</p>
        </div>
      </aside>
      <div className={shellStyles.main}>
        <header className={shellStyles.header}>
          <div className={shellStyles.headerSpacer} />
          <Link href={`/${locale}/settings`} className={shellStyles.headerUser}>
            {user.name}
          </Link>
        </header>
        <main className={cn(shellStyles.content, isOperator && shellStyles.contentWide)}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function MockBanner() {
  const t = useTranslations("common");
  return <div className={shellStyles.mockBanner}>{t("mockBanner")}</div>;
}

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={shellStyles.pageHeader}>
      <h1 className={shellStyles.pageTitle}>{title}</h1>
      {action}
    </div>
  );
}
