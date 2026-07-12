"use client";

import Link from "next/link";
import type { User, UserGroup } from "@/domain/types";
import { UserAvatar } from "@/components/profile/user-avatar";
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
        <Link
          href={`/${locale}/profile`}
          className={shellStyles.headerAvatarLink}
          title={user.name}
        >
          <UserAvatar userId={user.id} userName={user.name} />
        </Link>
        <UserMenu locale={locale} user={user} />
      </div>
    </header>
  );
}
