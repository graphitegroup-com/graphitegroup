import type { Metadata, Viewport } from "next";
import { Inter_Tight, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const sans = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"] });
const serif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});
const mono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Graphite Group · Student consulting at the Claremont Colleges",
    template: "%s · Graphite Group",
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
  themeColor: "#0c0d0f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
