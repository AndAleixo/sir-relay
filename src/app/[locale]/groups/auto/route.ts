import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveEntryPath } from "@/lib/entry-route";
import { requireSession } from "@/lib/require-session";
import { getServices } from "@/services";

/** Auto-pick sole group — cookie write must run in a Route Handler, not RSC render. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ locale: string }> },
) {
  const { locale } = await context.params;
  const session = await requireSession(locale);
  const { auth, groups } = getServices();

  const groupList = await groups.listForUser(session.user.id);
  if (groupList.length === 1 && !session.activeGroupId) {
    const next = await auth.setActiveGroup(session.user.id, groupList[0].id);
    revalidatePath("/", "layout");
    redirect(resolveEntryPath(locale, next));
  }

  redirect(`/${locale}/groups`);
}
