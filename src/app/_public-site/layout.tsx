import { Outfit, Source_Serif_4 } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// Body copy, set light as on ycombinator.com.
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], display: "swap" });
// Display type: titles, numerals, pill labels and italic emphasis.
const serif = Source_Serif_4({ variable: "--font-serif-4", subsets: ["latin"], style: ["normal", "italic"], display: "swap" });

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`site ${outfit.variable} ${serif.variable}`}>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
