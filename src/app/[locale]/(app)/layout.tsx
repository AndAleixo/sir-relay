import { AppLayoutClient } from "@/components/layout/app-layout-client";
import { requireAppSession } from "@/lib/require-session";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAppSession(locale);

  return (
    <AppLayoutClient locale={locale} user={session.user}>
      {children}
    </AppLayoutClient>
  );
}
