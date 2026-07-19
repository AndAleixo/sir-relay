import { getTranslations } from "next-intl/server";
import { AuditTable } from "@/components/platform/audit-table";
import { ButtonLink } from "@/components/ui/button";
import { queryAuditLogs } from "@/lib/audit";
import { listPlatformGroups } from "@/lib/platform-admin";

export default async function PlatformAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    groupId?: string;
    action?: string;
    actorId?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("platform");

  const page = Math.max(1, Number(sp.page) || 1);
  const groupId = sp.groupId || undefined;
  const action = sp.action || undefined;
  const actorId = sp.actorId || undefined;

  const [result, groups] = await Promise.all([
    queryAuditLogs({
      page,
      pageSize: 30,
      groupId,
      action,
      actorId,
    }),
    listPlatformGroups(),
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  function href(next: Record<string, string | undefined>) {
    const q = new URLSearchParams();
    const merged = {
      groupId,
      action,
      actorId,
      page: String(page),
      ...next,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) q.set(key, value);
    }
    const qs = q.toString();
    return `/${locale}/platform/audit${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t("audit.title")}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t("audit.subtitle")}</p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">{t("audit.group")}</span>
          <select
            name="groupId"
            defaultValue={groupId ?? ""}
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5"
          >
            <option value="">{t("audit.allGroups")}</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">{t("audit.action")}</span>
          <input
            name="action"
            defaultValue={action ?? ""}
            placeholder="login"
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">{t("audit.actorId")}</span>
          <input
            name="actorId"
            defaultValue={actorId ?? ""}
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 font-mono text-xs"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-brand-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-accent-hover"
        >
          {t("audit.filter")}
        </button>
      </form>

      <AuditTable
        locale={locale}
        entries={result.entries}
        empty={t("audit.empty")}
        labels={{
          when: t("audit.when"),
          action: t("audit.action"),
          actor: t("audit.actor"),
          group: t("audit.group"),
          detail: t("audit.detail"),
        }}
      />

      {totalPages > 1 ? (
        <div className="flex items-center gap-3 text-sm">
          {page > 1 ? (
            <ButtonLink href={href({ page: String(page - 1) })} variant="secondary">
              {t("audit.prev")}
            </ButtonLink>
          ) : null}
          <span className="text-[var(--text-muted)]">
            {t("audit.page", { page, totalPages })}
          </span>
          {page < totalPages ? (
            <ButtonLink href={href({ page: String(page + 1) })} variant="secondary">
              {t("audit.next")}
            </ButtonLink>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
