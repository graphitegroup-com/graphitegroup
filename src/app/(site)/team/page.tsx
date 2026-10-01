import type { Metadata } from "next";
import { TeamPageView } from "@/components/pages/team";

export const metadata: Metadata = {
  title: "Our People",
  description: "The students leading Graphite Group across the five Claremont Colleges.",
};

export default function TeamPage() {
  return <TeamPageView />;
}
