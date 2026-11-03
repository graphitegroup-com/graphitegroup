import { Suspense } from "react";
import { detailParams } from "@/lib/preview";
import { seed } from "@/portal/seed";
import ThreadView from "@/portal/views/thread";

export function generateStaticParams() {
  return detailParams("id", seed.posts.map((p) => p.id));
}

export default function ThreadPage() {
  return (
    <Suspense>
      <ThreadView />
    </Suspense>
  );
}
