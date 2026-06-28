import { redirect } from "next/navigation";
import { getServices } from "@/services";
import { resolveEntryPath } from "@/lib/entry-route";

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { auth } = getServices();
  const session = await auth.getSession();

  redirect(resolveEntryPath(locale, session));
}
