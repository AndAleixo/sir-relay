import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { listAuditForGroup } from "@/lib/audit";
import { requireOperatorSession } from "@/lib/require-session";
import { ButtonLink } from "@/components/ui/button";

const PAGE_SIZE = 30;

export default async function AuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page: pageRaw } = await searchParams;
  const session = await requireOperatorSession(locale);
  const t = await getTranslations();
  const groupId = session.activeGroupId!;
  const page = Math.max(1, Number(pageRaw) || 1);

  const { entries, total, pageSize } = await listAuditForGroup(groupId, {
    page,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PageHeader
        title={t("audit.title")}
        subtitle={t("audit.subtitle")}
      />
      <div className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">{t("audit.empty")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("audit.when")}</th>
                  <th className="px-3 py-2 font-medium">{t("audit.action")}</th>
                  <th className="px-3 py-2 font-medium">{t("audit.actor")}</th>
                  <th className="px-3 py-2 font-medium">{t("audit.detail")}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-t border-[var(--border)] align-top"
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-[var(--text-muted)]">
                      {new Date(entry.createdAt).toLocaleString(locale)}
                    </td>
                    <td className="px-3 py-2 font-medium text-[var(--text-primary)]">
                      {entry.action}
                    </td>
                    <td className="px-3 py-2 text-[var(--text-primary)]">
                      {entry.actorName ?? entry.actorType}
                    </td>
                    <td className="max-w-xs truncate px-3 py-2 font-mono text-xs text-[var(--text-muted)]">
                      {Object.keys(entry.metadata).length > 0
                        ? JSON.stringify(entry.metadata)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center gap-3 text-sm">
            {page > 1 ? (
              <ButtonLink
                href={`/${locale}/audit?page=${page - 1}`}
                variant="secondary"
              >
                {t("audit.prev")}
              </ButtonLink>
            ) : null}
            <span className="text-[var(--text-muted)]">
              {t("audit.page", { page, totalPages })}
            </span>
            {page < totalPages ? (
              <ButtonLink
                href={`/${locale}/audit?page=${page + 1}`}
                variant="secondary"
              >
                {t("audit.next")}
              </ButtonLink>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
