"use client";

import { cn } from "@/lib/cn";
import { shellStyles } from "./app-shell.styles";

interface SidebarLogoProps {
  appName: string;
  collapsed: boolean;
}

export function SidebarLogo({ appName, collapsed }: SidebarLogoProps) {
  return (
    <div
      className={cn(
        shellStyles.logoWrap,
        collapsed ? shellStyles.logoWrapCompact : shellStyles.logoWrapExtended,
      )}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.svg"
        alt=""
        className={cn(
          shellStyles.logoImage,
          shellStyles.logoExtended,
          collapsed ? shellStyles.logoHidden : shellStyles.logoVisible,
        )}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-compact.svg"
        alt=""
        className={cn(
          shellStyles.logoImage,
          shellStyles.logoCompact,
          collapsed ? shellStyles.logoVisible : shellStyles.logoHidden,
        )}
      />
      <span className="sr-only">{appName}</span>
    </div>
  );
}
