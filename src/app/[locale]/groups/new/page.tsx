import { redirect } from "next/navigation";

export default async function NewGroupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/groups?create=1`);
}
