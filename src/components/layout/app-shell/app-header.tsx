"use client";

import Link from "next/link";
import type { User } from "@/domain/types";
import { UserAvatar } from "@/components/profile/user-avatar";
import { LocaleSwitcher } from "./locale-switcher";
import { UserMenu } from "./user-menu";
import { shellStyles } from "./app-shell.styles";

interface AppHeaderProps {
  locale: string;
  user: User;
}

export function AppHeader({ locale, user }: AppHeaderProps) {
  return (
    <header className={shellStyles.header}>
      <LocaleSwitcher locale={locale} />
      <div className={shellStyles.headerActions}>
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
