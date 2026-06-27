import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { bannerStyles, type BannerVariant } from "./banner.styles";

interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BannerVariant;
}

export function Banner({
  variant = "warning",
  className,
  ...props
}: BannerProps) {
  return (
    <div
      role="status"
      className={cn(bannerStyles.base, bannerStyles.variants[variant], className)}
      {...props}
    />
  );
}
