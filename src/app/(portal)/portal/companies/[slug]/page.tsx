import { Suspense } from "react";
import { detailParams } from "@/lib/preview";
import { companyNames, companySlug } from "@/portal/logic";
import { seed } from "@/portal/seed";
import CompanyView from "@/portal/views/company";

export function generateStaticParams() {
  return detailParams("slug", [...new Set(companyNames(seed).map(companySlug))]);
}

export default function CompanyPage() {
  return (
    <Suspense>
      <CompanyView />
    </Suspense>
  );
}
