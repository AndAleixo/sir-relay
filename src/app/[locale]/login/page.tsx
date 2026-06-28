import { redirect } from "next/navigation";
import { getServices } from "@/services";
import { resolveEntryPath } from "@/lib/entry-route";

/** Legacy route — portal lives at /admin */
export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { auth } = getServices();
  const session = await auth.getSession();

  redirect(resolveEntryPath(locale, session));
}
