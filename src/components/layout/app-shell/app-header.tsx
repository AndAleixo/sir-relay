"use client";

import type { GroupInvitation, User, UserGroup } from "@/domain/types";
import type { AppShellDemo } from "./app-shell";
import { GroupName, GroupSwitcher } from "./group-switcher";
import { LocaleSwitcher } from "./locale-switcher";
import { UserMenu } from "./user-menu";
import { shellStyles } from "./app-shell.styles";

interface AppHeaderProps {
  locale: string;
  user: User;
  groups: UserGroup[];
  invitations: GroupInvitation[];
  activeGroupId: string | null;
  demo?: AppShellDemo;
  accountHref: string;
}

export function AppHeader({
  locale,
  user,
  groups,
  invitations,
  activeGroupId,
  demo,
  accountHref,
}: AppHeaderProps) {
  return (
    <header className={shellStyles.header}>
      <div className={shellStyles.headerGroup}>
        {demo ? (
          <GroupName groups={groups} activeGroupId={activeGroupId} />
        ) : (
          <GroupSwitcher
            locale={locale}
            groups={groups}
            invitations={invitations}
            activeGroupId={activeGroupId}
          />
        )}
      </div>
      <div className={shellStyles.headerActions}>
        <LocaleSwitcher locale={locale} />
        <UserMenu
          locale={locale}
          user={user}
          accountHref={accountHref}
          demo={demo}
        />
      </div>
    </header>
  );
}
