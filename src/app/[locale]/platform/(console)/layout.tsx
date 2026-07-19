import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { platformLogoutAction } from "@/app/actions/platform-auth";
import { PlatformNav } from "@/components/platform/platform-nav";
import { Button } from "@/components/ui/button";
import { requirePlatformAdminSession } from "@/lib/require-session";
import { getServices } from "@/services";

export default async function PlatformConsoleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const platform = await requirePlatformAdminSession(locale);
  const t = await getTranslations("platform");
  const appSession = await getServices().auth.getSession();

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface-elevated)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {t("brand")}
            </p>
            <p className="text-sm text-[var(--text-muted)]">{platform.username}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {appSession ? (
              <Link
                href={
                  appSession.activeGroupId
                    ? `/${locale}/tasks`
                    : `/${locale}/groups`
                }
                className="text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
              >
                {t("backToApp")}
              </Link>
            ) : null}
            <form action={platformLogoutAction.bind(null, locale)}>
              <Button type="submit" variant="ghost">
                {t("logout")}
              </Button>
            </form>
          </div>
        </div>
        <PlatformNav locale={locale} />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
