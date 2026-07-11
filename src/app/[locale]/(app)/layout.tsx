import { redirect } from "next/navigation";
import { getServices } from "@/services";
import { AppLayoutClient } from "@/components/layout/app-layout-client";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { auth } = getServices();
  const session = await auth.getSession();

  if (!session) {
    redirect(`/${locale}/admin?session=expired`);
  }

  if (session.user.mustChangePassword) {
    redirect(`/${locale}/change-password`);
  }

  return (
    <AppLayoutClient locale={locale} user={session.user}>
      {children}
    </AppLayoutClient>
  );
}
