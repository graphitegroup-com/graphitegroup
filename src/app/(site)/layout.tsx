import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VariantSwitcher } from "@/components/variant-switcher";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <VariantSwitcher />
    </>
  );
}
