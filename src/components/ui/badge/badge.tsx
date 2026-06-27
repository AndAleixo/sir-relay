import type { TaskStatus } from "@/domain/types";
import { cn } from "@/lib/cn";
import {
  badgeBase,
  statusBadgeVariants,
  type BadgeTone,
  toneBadgeVariants,
} from "./badge.styles";

interface StatusBadgeProps {
  status: TaskStatus;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span className={cn(badgeBase, statusBadgeVariants[status], className)}>
      {label}
    </span>
  );
}

interface ToneBadgeProps {
  tone: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

export function ToneBadge({ tone, children, className }: ToneBadgeProps) {
  return (
    <span className={cn(badgeBase, toneBadgeVariants[tone], className)}>
      {children}
    </span>
  );
}
