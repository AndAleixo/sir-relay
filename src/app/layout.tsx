import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { UmamiScript } from "@/components/analytics/umami-script";
import { seoMetadataBase } from "@/lib/seo";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const APP_DESCRIPTION =
  "Organize work alone or with any team. Assign tasks, follow what's left — without productivity theater.";

export const viewport: Viewport = {
  themeColor: "#EAB308",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: seoMetadataBase(),
  title: {
    default: "SRelay",
    template: "%s · SRelay",
  },
  description: APP_DESCRIPTION,
  applicationName: "SRelay",
  appleWebApp: {
    capable: true,
    title: "SRelay",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: "SRelay",
    title: "SRelay",
    description: APP_DESCRIPTION,
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "SRelay" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SRelay",
    description: APP_DESCRIPTION,
    images: ["/brand/og.png"],
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
