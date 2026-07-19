import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listPlatformGroups } from "@/lib/platform-admin";

export default async function PlatformGroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("platform");
  const groups = await listPlatformGroups();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t("groups.title")}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t("groups.subtitle")}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">{t("groups.name")}</th>
              <th className="px-3 py-2 font-medium">{t("groups.members")}</th>
              <th className="px-3 py-2 font-medium">{t("groups.created")}</th>
              <th className="px-3 py-2 font-medium">{t("groups.audit")}</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2 font-medium">{group.name}</td>
                <td className="px-3 py-2 tabular-nums">{group.memberCount}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">
                  {new Date(group.createdAt).toLocaleDateString(locale)}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/${locale}/platform/audit?groupId=${encodeURIComponent(group.id)}`}
                    className="text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
                  >
                    {t("groups.viewAudit")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
