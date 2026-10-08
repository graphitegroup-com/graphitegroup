import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { site } from "@/content/site";
import { VARIANT_BOOT } from "@/lib/variants";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Graphite Group | Consulting at the Claremont Colleges",
    template: "%s | Graphite Group",
  },
  description: site.description,
  openGraph: {
    title: "Graphite Group",
    description: site.description,
    url: site.url,
    siteName: "Graphite Group",
    images: [{ url: "/images/group-lawn.jpg", width: 2400, height: 1600 }],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-variant="original" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Apply the saved design variant before first paint (see components/variant-switcher.tsx). */}
        <script dangerouslySetInnerHTML={{ __html: VARIANT_BOOT }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
