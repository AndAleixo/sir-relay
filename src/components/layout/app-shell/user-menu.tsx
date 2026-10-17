"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { User } from "@/domain/types";
import { logoutAction } from "@/app/actions/auth";
import type { AppShellDemo } from "./app-shell";
import { UserAvatar } from "@/components/profile/user-avatar";
import { cn } from "@/lib/cn";
import { useDismissable } from "@/hooks/use-dismissable";
import { useFadeOpen } from "@/hooks/use-fade-open";
import { ChevronDown } from "@/components/ui/icons";
import { popoverStyles } from "@/components/ui/popover";
import { shellStyles } from "./app-shell.styles";

interface UserMenuProps {
  locale: string;
  user: User;
  accountHref: string;
  demo?: AppShellDemo;
}

export function UserMenu({ locale, user, accountHref, demo }: UserMenuProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const { rendered, visible, onTransitionEnd } = useFadeOpen(open);
  const rootRef = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => setOpen(false), []);
  useDismissable(open, dismiss, rootRef);

  return (
    <div ref={rootRef} className={shellStyles.userMenuRoot}>
      <button
        type="button"
        className={shellStyles.userMenuTrigger}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("shell.accountMenu")}
        onClick={() => setOpen((value) => !value)}
      >
        <UserAvatar userId={user.id} userName={user.name} />
        <ChevronDown className={open ? "rotate-180" : undefined} />
      </button>

      {rendered ? (
        <div
          className={cn(
            popoverStyles.panel,
            popoverStyles.panelDropdown,
            shellStyles.userMenuPanelWidth,
            visible
              ? popoverStyles.panelMotionOpen
              : popoverStyles.panelMotionClose,
            visible ? popoverStyles.panelOpen : popoverStyles.panelClosed,
          )}
          role="menu"
          onTransitionEnd={onTransitionEnd}
        >
          <div className={shellStyles.userMenuHeader}>
            <p className={shellStyles.userMenuName}>{user.name}</p>
          </div>
          <Link
            href={accountHref}
            className={cn(popoverStyles.item, shellStyles.userMenuItem)}
            role="menuitem"
            tabIndex={visible ? 0 : -1}
            onClick={() => setOpen(false)}
          >
            {t("common.account")}
          </Link>
          {demo ? (
            <>
              <Link
                href={`/${locale}/signup`}
                className={cn(popoverStyles.item, shellStyles.userMenuItem)}
                role="menuitem"
                tabIndex={visible ? 0 : -1}
                onClick={() => setOpen(false)}
              >
                {t("demo.bannerCta")}
              </Link>
              <button
                type="button"
                className={cn(
                  popoverStyles.item,
                  shellStyles.userMenuItem,
                  shellStyles.userMenuLogout,
                )}
                role="menuitem"
                tabIndex={visible ? 0 : -1}
                onClick={() => {
                  setOpen(false);
                  demo.onLeave();
                }}
              >
                {t("demo.leave")}
              </button>
            </>
          ) : (
            <form action={logoutAction.bind(null, locale)} className={shellStyles.userMenuForm}>
              <button
                type="submit"
                className={cn(
                  popoverStyles.item,
                  shellStyles.userMenuItem,
                  shellStyles.userMenuLogout,
                )}
                role="menuitem"
                tabIndex={visible ? 0 : -1}
              >
                {t("common.logout")}
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
