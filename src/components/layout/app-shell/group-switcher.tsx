"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { GroupInvitation, UserGroup } from "@/domain/types";
import { GroupPanelMenu } from "./group-panel-menu";

import { shellStyles } from "./app-shell.styles";

interface GroupSwitcherProps {
  locale: string;
  groups: UserGroup[];
  invitations: GroupInvitation[];
  activeGroupId: string | null;
  compact?: boolean;
}

type PanelAnchor = { top: number; left: number; width: number };

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
  invitations,
  activeGroupId,
  compact = false,
}: GroupSwitcherProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const mdDown = useMdDown();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelAnchor, setPanelAnchor] = useState<PanelAnchor | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevActiveGroupId = useRef(activeGroupId);
  const returnPath = pathname;
  const active =
    activeGroupId != null
      ? (groups.find((group) => group.id === activeGroupId) ?? null)
      : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!pathname.endsWith("/groups")) return;
    setOpen(compact === mdDown);
  }, [pathname, compact, mdDown]);

  useEffect(() => {
    if (prevActiveGroupId.current === activeGroupId) return;
    prevActiveGroupId.current = activeGroupId;
    setOpen(false);
    setShowCreate(false);
  }, [activeGroupId]);

  const closePanel = useCallback(() => {
    setOpen(false);
    setShowCreate(false);
  }, []);

  useLayoutEffect(() => {
    if (!open || !compact || !mdDown || !rootRef.current) {
      setPanelAnchor(null);
      return;
    }

    function updateAnchor() {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelAnchor({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.min(Math.max(rect.width, 16 * 16), 22 * 16),
      });
    }

    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);
    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [open, compact, mdDown]);

  useEffect(() => {
    if (!open) return;
    if (compact !== mdDown) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      closePanel();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePanel();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, compact, mdDown, closePanel]);

  const panelMenuProps = {
    locale,
    groups,
    invitations,
    activeGroupId,
    returnPath,
    panelOpen: open,
    showCreate,
    onShowCreate: setShowCreate,
  };

  const panelProps = {
    role: "menu" as const,
    "aria-label": t("groups.title"),
  };

  const desktopPanel = (
    <div ref={panelRef} className={shellStyles.groupSwitcherPanel} {...panelProps}>
      <GroupPanelMenu {...panelMenuProps} />
    </div>
  );

  const mobilePanel =
    open && compact && mdDown && mounted && panelAnchor
      ? createPortal(
          <>
            <button
              type="button"
              className={shellStyles.groupSwitcherBackdrop}
              aria-hidden
              tabIndex={-1}
              onClick={closePanel}
            />
            <div
              ref={panelRef}
              className={shellStyles.groupSwitcherPanelMobile}
              style={{
                top: panelAnchor.top,
                left: panelAnchor.left,
                width: panelAnchor.width,
              }}
              {...panelProps}
            >
              <GroupPanelMenu {...panelMenuProps} />
            </div>
          </>,
          document.body,
        )
      : null;

  const triggerLabel =
    active?.name ?? (groups.length === 0 ? t("groups.create") : t("shell.switchGroup"));

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
          shellStyles.headerControl,
          shellStyles.groupSwitcherTrigger,
          compact && shellStyles.groupSwitcherTriggerCompact,
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("shell.switchGroup")}
        onClick={() => setOpen((value) => !value)}
      >
        {compact ? (
          <>
            <span className={shellStyles.groupSwitcherNameCompact}>{triggerLabel}</span>
            {invitations.length > 0 ? (
              <span className="rounded-full bg-brand-accent px-1.5 text-xs font-semibold">
                {invitations.length}
              </span>
            ) : null}
            <Chevron className={open ? "rotate-180" : undefined} />
          </>
        ) : (
          <>
            <GroupIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <span className={shellStyles.groupSwitcherText}>
              <span className={shellStyles.groupSwitcherName}>{triggerLabel}</span>
              {active ? (
                <span className={shellStyles.groupSwitcherRole}>
                  {t(`roles.${active.role}`)}
                </span>
              ) : null}
            </span>
            {invitations.length > 0 ? (
              <span className="rounded-full bg-brand-accent px-1.5 text-xs font-semibold">
                {invitations.length}
              </span>
            ) : null}
            <Chevron className={open ? "rotate-180" : undefined} />
          </>
        )}
      </button>

      {open && !compact && !mdDown ? desktopPanel : null}
      {mobilePanel}
    </div>
  );
}

const MD_DOWN_MQ = "(max-width: 767px)";

function useMdDown() {
  const [mdDown, setMdDown] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia(MD_DOWN_MQ);
    const sync = () => setMdDown(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return mdDown;
}
