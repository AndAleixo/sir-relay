import { MockBanner } from "@/components/layout/app-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-bg">
      <MockBanner />
      {children}
    </div>
  );
}
