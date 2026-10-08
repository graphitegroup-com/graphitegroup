import type { Metadata } from "next";
import { PortalProvider } from "@/portal/store";
import { VariantSwitcher } from "@/components/variant-switcher";

export const metadata: Metadata = {
  title: "Member Portal",
  robots: { index: false },
};

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalProvider>
      {children}
      <VariantSwitcher />
    </PortalProvider>
  );
}
