import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, Source_Serif_4 } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const sans = Inter({ variable: "--font-inter", subsets: ["latin"] });
const display = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["500", "600", "700"] });
const serif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"], weight: ["400", "500", "600"] });

const STYLE_BOOT = `try{var q=new URLSearchParams(location.search).get("style");if(q==="classic"||q==="modern"){localStorage.setItem("gg-style",q)}var s=localStorage.getItem("gg-style");if(s==="classic"||s==="modern"){document.documentElement.dataset.style=s}}catch(e){}`;

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
    <html
      lang="en"
      data-style="classic"
      suppressHydrationWarning
      className={`${sans.variable} ${serif.variable} ${display.variable} antialiased`}
    >
      <head>
        {/* Apply the saved public style before first paint (see StyleSwitcher). */}
        <script dangerouslySetInnerHTML={{ __html: STYLE_BOOT }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
