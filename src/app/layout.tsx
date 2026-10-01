import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const sans = Inter({ variable: "--font-inter", subsets: ["latin"] });
const serif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"], weight: ["400", "500", "600"] });

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
  themeColor: "#1c2430",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
