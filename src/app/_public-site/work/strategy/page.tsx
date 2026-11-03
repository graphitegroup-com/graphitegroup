import type { Metadata } from "next";
import { PracticeView } from "@/components/pages/practice";

export const metadata: Metadata = {
  title: "Graphite Strategy",
  description: "Market entry, positioning, pricing, customer engagement and cost optimization.",
};

export default function StrategyPage() {
  return <PracticeView slug="strategy" />;
}
