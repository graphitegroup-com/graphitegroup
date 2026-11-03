import type { Metadata, Viewport } from "next";
import { Outfit, Source_Serif_4 } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

// Body copy, set light as on ycombinator.com.
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], display: "swap" });
// Display type: titles, numerals, pill labels and italic emphasis.
const serif = Source_Serif_4({ variable: "--font-serif-4", subsets: ["latin"], style: ["normal", "italic"], display: "swap" });

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
  themeColor: "#f5f5ee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${serif.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
