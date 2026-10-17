"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { GroupInvitation, User, UserGroup } from "@/domain/types";
import { UserAvatar } from "@/components/profile/user-avatar";
import { cn } from "@/lib/cn";
import { isNavItemActive } from "@/lib/navigation";
import { GroupName, GroupSwitcher } from "./group-switcher";
import { LocaleSwitcher } from "./locale-switcher";
import {
  SidebarNavIcon,
  type SidebarNavIconName,
} from "./sidebar-nav-icon";
import { shellStyles } from "./app-shell.styles";

export interface MobileNavItem {
  href: string;
  label: string;
  icon: SidebarNavIconName;
}

interface MobileTopBarProps {
  locale: string;
  appName: string;
  user: User;
  groups: UserGroup[];
  invitations: GroupInvitation[];
  activeGroupId: string | null;
  items: MobileNavItem[];
  homeHref: string;
  accountHref: string;
  groupLocked?: boolean;
}

export function MobileTopBar({
  locale,
  appName,
  user,
  groups,
  invitations,
  activeGroupId,
  items,
  homeHref,
  accountHref,
  groupLocked = false,
}: MobileTopBarProps) {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <header className={shellStyles.mobileHeader} data-mobile-shell-header>
      <div className={shellStyles.mobileHeaderTop}>
        <Link
          href={homeHref}
          className={shellStyles.mobileLogoLink}
          title={appName}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-compact.svg"
            alt={appName}
            className={shellStyles.mobileLogo}
          />
        </Link>
        <div className={shellStyles.mobileHeaderSwitcher}>
          {groupLocked ? (
            <GroupName groups={groups} activeGroupId={activeGroupId} compact />
          ) : (
            <GroupSwitcher
              locale={locale}
              groups={groups}
              invitations={invitations}
              activeGroupId={activeGroupId}
              compact
            />
          )}
        </div>
        <div className={shellStyles.mobileHeaderEnd}>
          <LocaleSwitcher locale={locale} compact />
          <Link
            href={accountHref}
            className={shellStyles.mobileUserLink}
            title={t("common.account")}
          >
            <UserAvatar userId={user.id} userName={user.name} />
          </Link>
        </div>
      </div>
      <nav className={shellStyles.mobileNav} aria-label={appName}>
        {items.map((item) => {
          const active = isNavItemActive(pathname, item.href, groupLocked ? homeHref : undefined);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                shellStyles.mobileNavLink,
                active && shellStyles.mobileNavLinkActive,
              )}
              aria-current={active ? "page" : undefined}
            >
              <SidebarNavIcon name={item.icon} className="h-5 w-5" />
              <span className={shellStyles.mobileNavLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
