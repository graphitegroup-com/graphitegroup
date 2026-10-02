import type { Metadata, Viewport } from "next";
import { Geist, Newsreader } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const sans = Geist({ variable: "--font-geist", subsets: ["latin"] });
const display = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

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
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
