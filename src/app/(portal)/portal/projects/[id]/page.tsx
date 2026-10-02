import { Suspense } from "react";
import { detailParams } from "@/lib/preview";
import { seed } from "@/portal/seed";
import ProjectView from "@/portal/views/project";

export function generateStaticParams() {
  return detailParams("id", seed.projects.map((p) => p.id));
}

export default function ProjectPage() {
  return (
    <Suspense>
      <ProjectView />
    </Suspense>
  );
}
