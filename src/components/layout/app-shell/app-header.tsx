"use client";

import Link from "next/link";
import type { User } from "@/domain/types";
import { UserAvatar } from "@/components/profile/user-avatar";
import { GroupSwitcher, type ShellGroup } from "./group-switcher";
import { LocaleSwitcher } from "./locale-switcher";
import { UserMenu } from "./user-menu";
import { shellStyles } from "./app-shell.styles";

interface AppHeaderProps {
  locale: string;
  user: User;
  groups: ShellGroup[];
  activeGroupId: string | null;
}

export function AppHeader({ locale, user, groups, activeGroupId }: AppHeaderProps) {
  const activeGroup = groups.find((group) => group.id === activeGroupId);

  return (
    <header className={shellStyles.header}>
      <div className={shellStyles.headerGroup}>
        <GroupSwitcher
          locale={locale}
          groups={groups}
          activeGroupId={activeGroupId}
          placement="below"
          prominent
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
        <UserMenu locale={locale} user={user} activeGroupName={activeGroup?.name ?? null} />
      </div>
    </header>
  );
}
