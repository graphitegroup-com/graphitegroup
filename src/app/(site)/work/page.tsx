import type { Metadata } from "next";
import { WorkPageView } from "@/components/pages/work";

export const metadata: Metadata = {
  title: "Our Work",
  description: "Selected Graphite Group engagements for IBM, vals.ai, Paulaner and more.",
};

export default function WorkPage() {
  return <WorkPageView />;
}
