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
import { useDismissable } from "@/hooks/use-dismissable";
import { useFadeOpen } from "@/hooks/use-fade-open";
import { ChevronDown } from "@/components/ui/icons";
import { popoverStyles } from "@/components/ui/popover";
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

/** Demo: the name only. Create and join post to the server. */
export function GroupName({
  groups,
  activeGroupId,
  compact = false,
}: {
  groups: UserGroup[];
  activeGroupId: string | null;
  compact?: boolean;
}) {
  const t = useTranslations();
  const active =
    activeGroupId != null
      ? (groups.find((group) => group.id === activeGroupId) ?? null)
      : null;
  const label =
    active?.name ?? (groups.length === 0 ? t("groups.create") : t("shell.switchGroup"));

  return (
    <div
      className={cn(
        shellStyles.groupSwitcherRoot,
        compact && shellStyles.groupSwitcherCompact,
      )}
    >
      <div
        className={cn(
          shellStyles.headerControl,
          shellStyles.groupSwitcherTrigger,
          compact && shellStyles.groupSwitcherTriggerCompact,
        )}
      >
        {compact ? (
          <span className={shellStyles.groupSwitcherNameCompact}>{label}</span>
        ) : (
          <>
            <GroupIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <span className={shellStyles.groupSwitcherText}>
              <span className={shellStyles.groupSwitcherName}>{label}</span>
              {active ? (
                <span className={shellStyles.groupSwitcherRole}>
                  {t(`roles.${active.role}`)}
                </span>
              ) : null}
            </span>
          </>
        )}
      </div>
    </div>
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

  const desktopOpen = open && !compact && !mdDown;
  const mobileOpen = open && compact && mdDown;
  const { rendered: desktopRendered, visible: desktopVisible, onTransitionEnd: onDesktopTransitionEnd } =
    useFadeOpen(desktopOpen);
  const { rendered: mobileRendered, visible: mobileVisible, onTransitionEnd: onMobileTransitionEnd } =
    useFadeOpen(mobileOpen);

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
    if (!mobileRendered || !compact || !mdDown || !rootRef.current) {
      if (!mobileRendered) setPanelAnchor(null);
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
  }, [mobileRendered, compact, mdDown]);

  useDismissable(
    open && compact === mdDown,
    closePanel,
    rootRef,
    panelRef,
  );

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

  const desktopPanel = desktopRendered ? (
    <div
      ref={panelRef}
      className={cn(
        popoverStyles.panel,
        shellStyles.groupSwitcherPanel,
        shellStyles.groupSwitcherPanelWidth,
        desktopVisible
          ? popoverStyles.panelMotionOpen
          : popoverStyles.panelMotionClose,
        desktopVisible ? popoverStyles.panelOpen : popoverStyles.panelClosed,
      )}
      onTransitionEnd={onDesktopTransitionEnd}
      {...panelProps}
    >
      <GroupPanelMenu {...panelMenuProps} />
    </div>
  ) : null;

  const mobilePanel =
    mobileRendered && mounted && panelAnchor
      ? createPortal(
          <>
            <button
              type="button"
              className={cn(
                shellStyles.groupSwitcherBackdrop,
                mobileVisible
                  ? shellStyles.groupSwitcherBackdropOpen
                  : shellStyles.groupSwitcherBackdropClosed,
              )}
              aria-hidden
              tabIndex={-1}
              onClick={closePanel}
            />
            <div
              ref={panelRef}
              className={cn(
                popoverStyles.panel,
                shellStyles.groupSwitcherPanelMobile,
                shellStyles.groupSwitcherPanelWidth,
                mobileVisible
                  ? popoverStyles.panelMotionOpen
                  : popoverStyles.panelMotionClose,
                mobileVisible
                  ? popoverStyles.panelOpen
                  : popoverStyles.panelClosed,
              )}
              style={{
                top: panelAnchor.top,
                left: panelAnchor.left,
                width: panelAnchor.width,
              }}
              onTransitionEnd={onMobileTransitionEnd}
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
            <ChevronDown className={open ? "rotate-180" : undefined} />
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
            <ChevronDown className={open ? "rotate-180" : undefined} />
          </>
        )}
      </button>

      {desktopPanel}
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
