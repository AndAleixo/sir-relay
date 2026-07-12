"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { UserGroup } from "@/domain/types";
import { GroupPanelMenu } from "./group-panel-menu";

import { shellStyles } from "./app-shell.styles";

interface GroupSwitcherProps {
  locale: string;
  groups: UserGroup[];
  activeGroupId: string | null;
  compact?: boolean;
  prominent?: boolean;
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

export function GroupSwitcher(props: GroupSwitcherProps) {
  return (
    <Suspense fallback={<GroupSwitcherFallback {...props} />}>
      <GroupSwitcherInner {...props} />
    </Suspense>
  );
}

function GroupSwitcherFallback({
  groups,
  activeGroupId,
  compact,
  prominent,
}: GroupSwitcherProps) {
  const t = useTranslations();
  const active =
    activeGroupId != null
      ? (groups.find((group) => group.id === activeGroupId) ?? null)
      : null;
  const triggerLabel =
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
          shellStyles.groupSwitcherTrigger,
          prominent && shellStyles.groupSwitcherTriggerProminent,
          compact && shellStyles.groupSwitcherTriggerCompact,
          "pointer-events-none opacity-80",
        )}
        aria-hidden
      >
        {compact ? (
          <>
            <span className={shellStyles.groupSwitcherNameCompact}>{triggerLabel}</span>
            <Chevron />
          </>
        ) : (
          <>
            <GroupIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <span className={shellStyles.groupSwitcherText}>
              <span className={shellStyles.groupSwitcherName}>{triggerLabel}</span>
            </span>
            <Chevron />
          </>
        )}
      </div>
    </div>
  );
}

function GroupSwitcherInner({
  locale,
  groups,
  activeGroupId,
  compact = false,
  prominent = false,
}: GroupSwitcherProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
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
    if (pathname.endsWith("/groups")) {
      setOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setOpen(true);
      setShowCreate(true);
      router.replace(pathname);
    }
  }, [searchParams, pathname, router]);

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
    if (!open || !compact || !rootRef.current) {
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
  }, [open, compact]);

  useEffect(() => {
    if (!open) return;

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
  }, [open, closePanel]);

  const panelMenuProps = {
    locale,
    groups,
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
    open && compact && mounted && panelAnchor
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
          shellStyles.groupSwitcherTrigger,
          prominent && shellStyles.groupSwitcherTriggerProminent,
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
            <Chevron className={open ? "rotate-180" : undefined} />
          </>
        )}
      </button>

      {open && !compact ? desktopPanel : null}
      {mobilePanel}
    </div>
  );
}
