"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { User } from "@/domain/types";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/cn";
import { shellStyles } from "./app-shell.styles";

interface UserMenuProps {
  locale: string;
  user: User;
}

export function UserMenu({ locale, user }: UserMenuProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className={shellStyles.userMenuPanel} role="menu">
          <div className={shellStyles.userMenuHeader}>
            <p className={shellStyles.userMenuName}>{user.name}</p>
          </div>
          <Link
            href={`/${locale}/profile`}
            className={shellStyles.userMenuItem}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {t("common.profile")}
          </Link>
          <Link
            href={`/${locale}/settings`}
            className={shellStyles.userMenuItem}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {t("common.settings")}
          </Link>
          <form action={logoutAction.bind(null, locale)} className={shellStyles.userMenuForm}>
            <button type="submit" className={cn(shellStyles.userMenuItem, shellStyles.userMenuLogout)} role="menuitem">
              {t("common.logout")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
