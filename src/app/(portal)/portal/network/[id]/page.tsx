import { Suspense } from "react";
import { detailParams } from "@/lib/preview";
import { seed } from "@/portal/seed";
import ContactView from "@/portal/views/contact";

export function generateStaticParams() {
  return detailParams("id", seed.contacts.map((c) => c.id));
}

export default function ContactPage() {
  return (
    <Suspense>
      <ContactView />
    </Suspense>
  );
}
