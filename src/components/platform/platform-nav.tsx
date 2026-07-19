"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "", key: "navOverview" as const },
  { href: "/audit", key: "navAudit" as const },
  { href: "/users", key: "navUsers" as const },
  { href: "/groups", key: "navGroups" as const },
  { href: "/health", key: "navHealth" as const },
];

export function PlatformNav({ locale }: { locale: string }) {
  const pathname = usePathname();
  const t = useTranslations("platform");
  const base = `/${locale}/platform`;

  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
      {NAV.map((item) => {
        const href = `${base}${item.href}`;
        const active =
          item.href === ""
            ? pathname === base || pathname === `${base}/`
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={item.key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium",
              active
                ? "bg-[var(--surface-muted)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
