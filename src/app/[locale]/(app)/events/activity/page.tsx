import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { describeGroupActivity } from "@/lib/activity-copy";
import { listAuditForGroup, resolveActivityLabels } from "@/lib/audit";
import { requireOperatorSession } from "@/lib/require-session";

const PAGE_SIZE = 30;

export default async function GroupActivityPage({
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
    activityOnly: true,
  });
  const { taskTitles, userNames } = await resolveActivityLabels(entries);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function statusLabel(status: string) {
    if (status === "todo" || status === "doing" || status === "done") {
      return t(`status.${status}`);
    }
    return status || "—";
  }

  const lines = entries.flatMap((entry) => {
    const message = describeGroupActivity(entry, {
      taskTitles,
      userNames,
      statusLabel,
    });
    if (!message) return [];
    return [
      {
        id: entry.id,
        createdAt: entry.createdAt,
        text: t(`events.activity.${message.key}` as "events.activity.task_create", {
          ...message.values,
        }),
      },
    ];
  });

  return (
    <>
      <PageHeader
        title={t("events.activity.title")}
        subtitle={t("events.activity.subtitle")}
        action={
          <ButtonLink href={`/${locale}/events`} variant="secondary">
            {t("events.activity.back")}
          </ButtonLink>
        }
      />
      <div className="space-y-4">
        {lines.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">{t("events.activity.empty")}</p>
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
            {lines.map((line) => (
              <li key={line.id} className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:gap-4">
                <time
                  dateTime={line.createdAt}
                  className="shrink-0 text-xs text-[var(--text-muted)] sm:w-44 sm:text-sm"
                >
                  {new Date(line.createdAt).toLocaleString(locale)}
                </time>
                <p className="text-sm text-[var(--text-primary)]">{line.text}</p>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center gap-3 text-sm">
            {page > 1 ? (
              <ButtonLink
                href={`/${locale}/events/activity?page=${page - 1}`}
                variant="secondary"
              >
                {t("events.activity.prev")}
              </ButtonLink>
            ) : null}
            <span className="text-[var(--text-muted)]">
              {t("events.activity.page", { page, totalPages })}
            </span>
            {page < totalPages ? (
              <ButtonLink
                href={`/${locale}/events/activity?page=${page + 1}`}
                variant="secondary"
              >
                {t("events.activity.next")}
              </ButtonLink>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
