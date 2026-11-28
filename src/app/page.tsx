import { redirect } from "next/navigation";
import { defaultLocale, locales } from "@/i18n/config";
import { getServices } from "@/services";

export default async function RootPage() {
  const session = await getServices().auth.getSession();
  const preferred = session?.user.locale;
  if (preferred && (locales as readonly string[]).includes(preferred)) {
    redirect(`/${preferred}`);
  }
  redirect(`/${defaultLocale}`);
}
