"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Role } from "@/domain/types";
import { mockSelectGroup } from "@/app/actions/mock-groups";
import { cn } from "@/lib/cn";
import { shellStyles } from "./app-shell.styles";

export type ShellGroup = {
  id: string;
  name: string;
  role: Role;
};

interface GroupSwitcherProps {
  locale: string;
  groups: ShellGroup[];
  activeGroupId: string | null;
  collapsed?: boolean;
  compact?: boolean;
  prominent?: boolean;
  placement?: "below" | "above";
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 shrink-0", className)}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function GroupIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5", className)}
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function GroupSwitcher({
  locale,
  groups,
  activeGroupId,
  collapsed = false,
  compact = false,
  prominent = false,
  placement = "above",
}: GroupSwitcherProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelTop, setPanelTop] = useState(72);
  const rootRef = useRef<HTMLDivElement>(null);
  const active =
    activeGroupId != null
      ? (groups.find((group) => group.id === activeGroupId) ?? null)
      : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [activeGroupId]);

  useLayoutEffect(() => {
    if (!open || !compact) return;

    function measure() {
      const header = document.querySelector("[data-mobile-shell-header]");
      const bottom = header?.getBoundingClientRect().bottom ?? 56;
      setPanelTop(bottom + 4);
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [open, compact]);

  useEffect(() => {
    if (!open || compact) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, compact]);

  useEffect(() => {
    if (!open || !compact) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, compact]);

  if (groups.length === 0) return null;

  const menu = (
    <>
      <ul className="py-1">
        {groups.map((group) => (
          <li key={group.id}>
            {group.id === activeGroupId ? (
              <div
                className={cn(
                  shellStyles.groupSwitcherItem,
                  shellStyles.groupSwitcherItemActive,
                )}
                role="menuitem"
                aria-current="true"
              >
                <span className="truncate font-medium">{group.name}</span>
                <span className={shellStyles.groupSwitcherItemRole}>
                  {t(`roles.${group.role}`)}
                </span>
              </div>
            ) : (
              <form
                action={mockSelectGroup.bind(null, locale, group.id)}
                onSubmit={() => setOpen(false)}
              >
                <button
                  type="submit"
                  className={shellStyles.groupSwitcherItem}
                  role="menuitem"
                >
                  <span className="truncate">{group.name}</span>
                  <span className={shellStyles.groupSwitcherItemRole}>
                    {t(`roles.${group.role}`)}
                  </span>
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <div className={shellStyles.groupSwitcherFooter}>
        <Link
          href={`/${locale}/groups/new`}
          className={shellStyles.groupSwitcherFooterLink}
          role="menuitem"
          onClick={() => setOpen(false)}
        >
          {t("groups.create")}
        </Link>
        <Link
          href={`/${locale}/groups`}
          className={shellStyles.groupSwitcherFooterLink}
          role="menuitem"
          onClick={() => setOpen(false)}
        >
          {t("shell.manageGroups")}
        </Link>
      </div>
    </>
  );

  const desktopPanel = (
    <div
      className={cn(
        shellStyles.groupSwitcherPanel,
        placement === "below" && shellStyles.groupSwitcherPanelBelow,
        collapsed && shellStyles.groupSwitcherPanelCollapsed,
      )}
      role="menu"
    >
      {menu}
    </div>
  );

  const mobileOverlay =
    open && compact && mounted
      ? createPortal(
          <>
            <button
              type="button"
              className={shellStyles.groupSwitcherBackdrop}
              aria-hidden
              tabIndex={-1}
              onClick={() => setOpen(false)}
            />
            <div
              className={shellStyles.groupSwitcherPanelMobile}
              style={{ top: panelTop }}
              role="menu"
            >
              {menu}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={cn(
        shellStyles.groupSwitcherRoot,
        compact && shellStyles.groupSwitcherCompact,
      )}
    >
      <button
        type="button"
        className={cn(
          shellStyles.groupSwitcherTrigger,
          prominent && shellStyles.groupSwitcherTriggerProminent,
          collapsed && shellStyles.groupSwitcherTriggerCollapsed,
          compact && shellStyles.groupSwitcherTriggerCompact,
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("shell.switchGroup")}
        title={collapsed ? (active?.name ?? t("shell.switchGroup")) : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        {collapsed ? (
          <GroupIcon />
        ) : compact ? (
          <>
            <span className={shellStyles.groupSwitcherNameCompact}>
              {active?.name ?? t("shell.switchGroup")}
            </span>
            <Chevron className={open ? "rotate-180" : undefined} />
          </>
        ) : (
          <>
            <GroupIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <span className={shellStyles.groupSwitcherText}>
              <span className={shellStyles.groupSwitcherName}>
                {active?.name ?? t("shell.switchGroup")}
              </span>
              {active ? (
                <span className={shellStyles.groupSwitcherRole}>
                  {t(`roles.${active.role}`)}
                </span>
              ) : null}
            </span>
            <Chevron className={open ? "rotate-180" : undefined} />
          </>
        )}
      </button>

      {open && !compact ? desktopPanel : null}
      {mobileOverlay}
    </div>
  );
}
