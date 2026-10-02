import { Suspense } from "react";
import { detailParams } from "@/lib/preview";
import { companySlug } from "@/portal/logic";
import { seed } from "@/portal/seed";
import CompanyView from "@/portal/views/company";

export function generateStaticParams() {
  const names = [...seed.applications, ...seed.reports, ...seed.contacts].map((x) => x.company.trim()).filter(Boolean);
  return detailParams("slug", [...new Set(names.map(companySlug))]);
}

export default function CompanyPage() {
  return (
    <Suspense>
      <CompanyView />
    </Suspense>
  );
}
