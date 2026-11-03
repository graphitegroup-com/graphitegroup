import type { Metadata, Viewport } from "next";
import { site } from "@/content/site";
import "./globals.css";

// This app is the members-only portal. The public site stays on Webflow for now;
// its pages are kept, unrouted, in src/app/_public-site (see README).
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Graphite Portal",
    template: "%s | Graphite Portal",
  },
  description: "The private portal for Graphite Group members and alumni.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
