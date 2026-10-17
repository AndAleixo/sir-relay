"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type {
  GroupInvitation,
  User,
  UserGroup,
} from "@/domain/types";
import { isNavItemActive } from "@/lib/navigation";
import { UserAvatar } from "@/components/profile/user-avatar";
import { cn } from "@/lib/cn";
import { AppHeader } from "./app-header";
import { MobileTopBar } from "./mobile-top-bar";
import { SidebarLogo } from "./sidebar-logo";
import {
  SidebarNavIcon,
  type SidebarNavIconName,
} from "./sidebar-nav-icon";
import { useSidebarCollapsed } from "./use-sidebar-collapsed";
import { shellStyles } from "./app-shell.styles";

interface NavItem {
  href: string;
  label: string;
  icon: SidebarNavIconName;
}

/** Try-demo: same chrome, links stay under `basePath`, no server session. */
export type AppShellDemo = {
  basePath: string;
  onLeave: () => void;
};

interface AppShellProps {
  locale: string;
  user: User;
  groups: UserGroup[];
  invitations: GroupInvitation[];
  activeGroupId: string | null;
  demo?: AppShellDemo;
  children: React.ReactNode;
}

export function AppShell({
  locale,
  user,
  groups,
  invitations,
  activeGroupId,
  demo,
  children,
}: AppShellProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarCollapsed();
  const hasActiveGroup = activeGroupId != null;
  const homeHref = demo?.basePath ?? `/${locale}/tasks`;
  const accountHref = demo ? `${demo.basePath}/profile` : `/${locale}/profile`;

  const nav: NavItem[] = [
    {
      href: homeHref,
      label: t("common.tasks"),
      icon: "tasks",
    },
    {
      href: demo ? `${demo.basePath}/teammates` : `/${locale}/teammates`,
      label: t("common.teammates"),
      icon: "teammates",
    },
    {
      href: demo ? `${demo.basePath}/projects` : `/${locale}/projects`,
      label: t("common.projects"),
      icon: "projects",
    },
    {
      href: demo ? `${demo.basePath}/events` : `/${locale}/events`,
      label: t("common.events"),
      icon: "events",
    },
    ...(demo
      ? []
      : [
          {
            href: `/${locale}/settings`,
            label: t("common.settings"),
            icon: "settings" as const,
          },
        ]),
  ];

  const visibleNav = hasActiveGroup ? nav : [];

  return (
    <div className={shellStyles.root}>
      <div
        className={cn(
          shellStyles.sidebarShell,
          collapsed ? shellStyles.sidebarCollapsed : shellStyles.sidebarExpanded,
        )}
      >
        <aside className={shellStyles.sidebar}>
          <Link
            href={homeHref}
            className={cn(
              shellStyles.logoLink,
              collapsed && shellStyles.logoLinkCollapsed,
            )}
            title={t("common.appName")}
          >
            <SidebarLogo appName={t("common.appName")} collapsed={collapsed} />
          </Link>

          <nav
            className={cn(shellStyles.nav, collapsed && shellStyles.navCollapsed)}
          >
            {visibleNav.map((item) => {
              const active = isNavItemActive(pathname, item.href, demo?.basePath);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    shellStyles.navLink,
                    active && shellStyles.navLinkActive,
                    collapsed && shellStyles.navLinkCollapsed,
                  )}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <SidebarNavIcon name={item.icon} />
                  <span
                    className={cn(
                      shellStyles.navLabel,
                      collapsed && shellStyles.navLabelCollapsed,
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div
            className={cn(
              shellStyles.sidebarFooter,
              collapsed && shellStyles.sidebarFooterCollapsed,
            )}
          >
            <Link
              href={accountHref}
              className={cn(
                shellStyles.sidebarProfileLink,
                collapsed && shellStyles.sidebarProfileLinkCollapsed,
              )}
              title={t("common.account")}
            >
              <UserAvatar userId={user.id} userName={user.name} />
              <div
                className={cn(
                  shellStyles.userBlock,
                  collapsed && shellStyles.userBlockCollapsed,
                )}
              >
                <p className={shellStyles.userName}>{user.name}</p>
              </div>
            </Link>
          </div>
        </aside>

        <button
          type="button"
          className={shellStyles.collapseToggle}
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={
            collapsed ? t("shell.expandSidebar") : t("shell.collapseSidebar")
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              shellStyles.collapseChevron,
              collapsed && shellStyles.collapseChevronRotated,
            )}
            aria-hidden
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className={shellStyles.main}>
        <MobileTopBar
          locale={locale}
          appName={t("common.appName")}
          user={user}
          groups={groups}
          invitations={invitations}
          activeGroupId={activeGroupId}
          items={visibleNav}
          homeHref={homeHref}
          accountHref={accountHref}
          groupLocked={Boolean(demo)}
        />
        <AppHeader
          locale={locale}
          user={user}
          groups={groups}
          invitations={invitations}
          activeGroupId={activeGroupId}
          demo={demo}
          accountHref={accountHref}
        />
        <main className={cn(shellStyles.content, shellStyles.contentWide)}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  if (!title && !action) return null;

  return (
    <div
      className={cn(
        shellStyles.pageHeader,
        !title && shellStyles.pageHeaderActionOnly,
      )}
    >
      {title ? (
        <div>
          <h1 className={shellStyles.pageTitle}>{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
      {action}
    </div>
  );
}
