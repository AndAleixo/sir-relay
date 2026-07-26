import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuditTable } from "@/components/platform/audit-table";
import {
  countAuditSince,
  countDistinctGroupsWithAuditSince,
  queryAuditLogs,
} from "@/lib/audit";

export default async function PlatformOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("platform");

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [logins, loginFailed, exportsCount, activeGroups, recent] = await Promise.all([
    countAuditSince(since, "login"),
    countAuditSince(since, "login_failed"),
    countAuditSince(since, "export_data"),
    countDistinctGroupsWithAuditSince(since),
    queryAuditLogs({ page: 1, pageSize: 20 }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">{t("overview.title")}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t("overview.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("overview.logins7d")} value={logins} />
        <Stat label={t("overview.loginFailed7d")} value={loginFailed} />
        <Stat label={t("overview.exports7d")} value={exportsCount} />
        <Stat label={t("overview.groups7d")} value={activeGroups} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">{t("overview.recent")}</h2>
          <Link
            href={`/${locale}/platform/audit`}
            className="text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
          >
            {t("overview.viewAudit")}
          </Link>
        </div>
        <AuditTable
          locale={locale}
          entries={recent.entries}
          empty={t("audit.empty")}
          labels={{
            when: t("audit.when"),
            action: t("audit.action"),
            actor: t("audit.actor"),
            group: t("audit.group"),
            detail: t("audit.detail"),
          }}
        />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] px-4 py-3">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
