"use client";

import { cn } from "@/lib/cn";
import { useProfileAvatar } from "@/hooks/use-profile-avatar";

export function userInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

interface UserAvatarProps {
  userId: string;
  userName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-20 w-20 text-2xl",
} as const;

export function UserAvatar({
  userId,
  userName,
  size = "sm",
  className,
}: UserAvatarProps) {
  const { avatarUrl } = useProfileAvatar(userId);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-accent-soft font-semibold text-brand-accent",
        sizeClasses[size],
        className,
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        userInitial(userName)
      )}
    </span>
  );
}
