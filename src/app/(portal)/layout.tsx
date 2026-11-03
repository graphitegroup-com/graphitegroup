import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import { PortalProvider } from "@/portal/store";
import "@/portal/portal.css";

// Bookface sets type in Avenir. Apple devices have it; everyone else gets the closest open font.
const nunito = Nunito_Sans({ variable: "--font-portal", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Member Portal",
  robots: { index: false },
};

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={nunito.variable}>
      <PortalProvider>{children}</PortalProvider>
    </div>
  );
}
