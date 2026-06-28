"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/domain/types";
import { UserAvatar } from "@/components/profile/user-avatar";
import { cn } from "@/lib/cn";
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
  items: MobileNavItem[];
}

function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTopBar({
  locale,
  appName,
  user,
  items,
}: MobileTopBarProps) {
  const pathname = usePathname();

  return (
    <header className={shellStyles.mobileHeader}>
      <div className={shellStyles.mobileHeaderTop}>
        <Link
          href={`/${locale}/tasks`}
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
        <div className={shellStyles.mobileHeaderActions}>
          <LocaleSwitcher locale={locale} compact />
          <Link
            href={`/${locale}/profile`}
            className={shellStyles.mobileUserLink}
            title={user.name}
          >
            <UserAvatar userId={user.id} userName={user.name} />
          </Link>
        </div>
      </div>
      <nav className={shellStyles.mobileNav} aria-label={appName}>
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
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
