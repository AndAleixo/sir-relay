import type { ReactNode } from "react";
import type { TelegramLinkStatus } from "@/domain/types";
import { cn } from "@/lib/cn";
import { AccountInactiveIcon } from "@/components/ui/account-inactive-icon";
import { TelegramStatusIcon } from "@/components/ui/telegram-status-icon";

type MemberStatusIconsProps = {
  telegramStatus?: TelegramLinkStatus | null;
  /** When set, show inactive mark with this accessible label. */
  inactiveLabel?: string | null;
  labels: {
    linked: string;
    pending: string;
  };
  className?: string;
};

export function MemberStatusIcons({
  telegramStatus,
  inactiveLabel,
  labels,
  className,
}: MemberStatusIconsProps) {
  if (!inactiveLabel && !telegramStatus) return null;

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5", className)}>
      {inactiveLabel ? <AccountInactiveIcon label={inactiveLabel} /> : null}
      {telegramStatus ? (
        <TelegramStatusIcon
          status={telegramStatus}
          label={telegramStatus === "linked" ? labels.linked : labels.pending}
        />
      ) : null}
    </span>
  );
}

/** Name left · status icons right. */
export function MemberNameRow({
  nameNode,
  telegramStatus,
  inactiveLabel,
  labels,
  className,
}: {
  nameNode: ReactNode;
  telegramStatus?: TelegramLinkStatus | null;
  inactiveLabel?: string | null;
  labels: MemberStatusIconsProps["labels"];
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center justify-between gap-2", className)}>
      <div className="min-w-0 flex-1 truncate">{nameNode}</div>
      <MemberStatusIcons
        telegramStatus={telegramStatus}
        inactiveLabel={inactiveLabel}
        labels={labels}
      />
    </div>
  );
}

export function memberInactiveLabel(
  user: {
    active?: boolean;
    accountStatus?: "active" | "invited" | null;
  },
  labels: { invited: string; inactive: string },
): string | null {
  if (user.accountStatus === "invited") return labels.invited;
  if (user.active === false) return labels.inactive;
  return null;
}
