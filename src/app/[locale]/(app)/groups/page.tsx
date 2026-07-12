import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { resolveEntryPath } from "@/lib/entry-route";
import { requireSession } from "@/lib/require-session";
import { getServices } from "@/services";

export default async function GroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const session = await requireSession(locale);
  const { groups } = getServices();

  const groupList = await groups.listForUser(session.user.id);
  if (groupList.length === 1 && !session.activeGroupId) {
    redirect(`/${locale}/groups/auto`);
  }

  if (session.activeGroupId) {
    redirect(resolveEntryPath(locale, session));
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">
        {t("groups.title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{t("groups.pickFromMenu")}</p>
    </div>
  );
}
