export function AuditTable({
  locale,
  entries,
  empty,
  labels,
}: {
  locale: string;
  entries: {
    id: string;
    createdAt: string;
    action: string;
    actorName: string | null;
    actorType: string;
    groupId: string | null;
    metadata: Record<string, unknown>;
  }[];
  empty: string;
  labels: {
    when: string;
    action: string;
    actor: string;
    group: string;
    detail: string;
  };
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
          <tr>
            <th className="px-3 py-2 font-medium">{labels.when}</th>
            <th className="px-3 py-2 font-medium">{labels.action}</th>
            <th className="px-3 py-2 font-medium">{labels.actor}</th>
            <th className="px-3 py-2 font-medium">{labels.group}</th>
            <th className="px-3 py-2 font-medium">{labels.detail}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const { _groupName, ...rest } = entry.metadata;
            const groupLabel =
              (typeof _groupName === "string" && _groupName) ||
              entry.groupId ||
              "—";
            const detailKeys = Object.keys(rest);
            return (
              <tr key={entry.id} className="border-t border-[var(--border)] align-top">
                <td className="whitespace-nowrap px-3 py-2 text-[var(--text-muted)]">
                  {new Date(entry.createdAt).toLocaleString(locale)}
                </td>
                <td className="px-3 py-2 font-medium">{entry.action}</td>
                <td className="px-3 py-2">
                  {entry.actorName ?? entry.actorType}
                </td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{groupLabel}</td>
                <td className="max-w-xs truncate px-3 py-2 font-mono text-xs text-[var(--text-muted)]">
                  {detailKeys.length > 0 ? JSON.stringify(rest) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
