import type { ReactNode } from "react";
import { DemoAppFrame } from "@/components/demo/demo-app-frame";
import { DemoProvider } from "@/components/demo/demo-provider";

export default async function DemoAppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <DemoProvider>
      <DemoAppFrame locale={locale}>{children}</DemoAppFrame>
    </DemoProvider>
  );
}
