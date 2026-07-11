import { redirect } from "next/navigation";

/** Legacy route — use /login */
export default async function AdminRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; session?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const paramsStr = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v != null) as [string, string][],
  ).toString();
  redirect(`/${locale}/login${paramsStr ? `?${paramsStr}` : ""}`);
}
