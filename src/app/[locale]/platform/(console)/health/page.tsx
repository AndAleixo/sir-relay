import { getTranslations } from "next-intl/server";
import { checkDatabaseHealth } from "@/lib/platform-admin";

export default async function PlatformHealthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("platform");
  const health = await checkDatabaseHealth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t("health.title")}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t("health.subtitle")}</p>
      </div>

      <dl className="space-y-3 rounded-lg border border-[var(--border)] px-4 py-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--text-muted)]">{t("health.database")}</dt>
          <dd className="font-medium">
            {health.ok ? t("health.ok") : t("health.fail")}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--text-muted)]">{t("health.checkedAt")}</dt>
          <dd className="font-mono text-xs">
            {new Date(health.checkedAt).toLocaleString(locale)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--text-muted)]">{t("health.publicEndpoint")}</dt>
          <dd className="font-mono text-xs">/api/v1/health</dd>
        </div>
      </dl>
    </div>
  );
}
