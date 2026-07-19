import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listPlatformUsers } from "@/lib/platform-admin";

export default async function PlatformUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("platform");
  const users = await listPlatformUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t("users.title")}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t("users.subtitle")}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">{t("users.email")}</th>
              <th className="px-3 py-2 font-medium">{t("users.name")}</th>
              <th className="px-3 py-2 font-medium">{t("users.status")}</th>
              <th className="px-3 py-2 font-medium">{t("users.audit")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2 font-mono text-xs">{user.email}</td>
                <td className="px-3 py-2">{user.name || "—"}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">
                  {user.active ? t("users.active") : t("users.inactive")}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/${locale}/platform/audit?actorId=${encodeURIComponent(user.id)}`}
                    className="text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
                  >
                    {t("users.viewAudit")}
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
