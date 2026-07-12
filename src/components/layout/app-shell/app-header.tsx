"use client";

import type { User, UserGroup } from "@/domain/types";
import { GroupSwitcher } from "./group-switcher";
import { LocaleSwitcher } from "./locale-switcher";
import { UserMenu } from "./user-menu";
import { shellStyles } from "./app-shell.styles";

interface AppHeaderProps {
  locale: string;
  user: User;
  groups: UserGroup[];
  activeGroupId: string | null;
}

export function AppHeader({ locale, user, groups, activeGroupId }: AppHeaderProps) {
  return (
    <header className={shellStyles.header}>
      <div className={shellStyles.headerGroup}>
        <GroupSwitcher
          locale={locale}
          groups={groups}
          activeGroupId={activeGroupId}
        />
      </div>
      <div className={shellStyles.headerActions}>
        <LocaleSwitcher locale={locale} />
        <UserMenu locale={locale} user={user} />
      </div>
    </header>
  );
}
