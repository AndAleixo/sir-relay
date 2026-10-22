import { redirect } from "next/navigation";
import { editorUriScheme } from "@/lib/connect-next";

/** Legacy URL — bookmarks / old extension builds. */
export default async function LegacyVsCodeConnectRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ scheme?: string }>;
}) {
  const { locale } = await params;
  const { scheme: schemeRaw } = await searchParams;
  const scheme = editorUriScheme(schemeRaw);
  redirect(`/${locale}/connect?scheme=${scheme}`);
}
