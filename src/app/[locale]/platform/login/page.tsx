import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PlatformLoginForm } from "@/components/platform/platform-login-form";
import {
  platformAdminConfigured,
  readPlatformSession,
} from "@/lib/platform-session";

export default async function PlatformLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const existing = await readPlatformSession();
  if (existing) redirect(`/${locale}/platform`);

  const t = await getTranslations("platform");
  const configured = platformAdminConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {t("brand")}
          </p>
          <h1 className="mt-1 text-xl font-semibold">{t("login.title")}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{t("login.subtitle")}</p>
        </div>
        <PlatformLoginForm locale={locale} configured={configured} />
      </div>
    </div>
  );
}
