import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { UmamiScript } from "@/components/analytics/umami-script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SirRelay",
  description: "Task relay for small teams",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <UmamiScript />
      </body>
    </html>
  );
}
