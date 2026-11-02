import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { UmamiScript } from "@/components/analytics/umami-script";
import { seoMetadataBase } from "@/lib/seo";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const APP_DESCRIPTION =
  "Organize work alone or with any team. Assign tasks, follow what's left — without productivity theater.";

export const metadata: Metadata = {
  metadataBase: seoMetadataBase(),
  title: {
    default: "SRelay",
    template: "%s · SRelay",
  },
  description: APP_DESCRIPTION,
  applicationName: "SRelay",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    siteName: "SRelay",
    title: "SRelay",
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: "SRelay",
    description: APP_DESCRIPTION,
  },
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
